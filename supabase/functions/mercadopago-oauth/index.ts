import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response("ok", { headers });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const url = new URL(req.url);

    if (req.method === "GET") {
      const storeId = url.searchParams.get("store_id");
      console.log("Status check for store_id:", storeId);

      if (!storeId) {
        return new Response(JSON.stringify({ error: "Missing store_id" }), { status: 400, headers });
      }

      // Check payment provider configuration
      const { data: settings, error } = await supabase
        .from("store_settings")
        .select("payment_provider")
        .eq("store_id", storeId)
        .maybeSingle();
      
      console.log("Settings found:", settings);

      if (error) {
        console.error("Error fetching settings:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      if (!settings || settings.payment_provider !== "mercadopago") {
        return new Response(JSON.stringify({ status: "disconnected", debug_id: storeId }), { headers });
      }

      // Fetch connection status details from store_secrets
      const { data: secrets, error: secretsErr } = await supabase
        .from("store_secrets")
        .select("mp_user_id, mp_token_expires_at")
        .eq("store_id", storeId)
        .maybeSingle();

      if (secretsErr) {
        console.error("Error fetching secrets:", secretsErr);
        return new Response(JSON.stringify({ error: secretsErr.message }), { status: 500, headers });
      }

      return new Response(JSON.stringify({
        status: "connected",
        mp_user_id: secrets?.mp_user_id || null,
        mp_token_expires_at: secrets?.mp_token_expires_at || null,
      }), { headers });
    }

    if (req.method === "POST") {
      const body = await req.json();
      console.log("POST Action:", body.action, "for store:", body.store_id);

      if (!body.store_id) {
        return new Response(JSON.stringify({ error: "Missing store_id" }), { status: 400, headers });
      }

      if (body.action === "exchange") {
        const mpRes = await fetch("https://api.mercadopago.com/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: Deno.env.get("MP_APP_ID"),
            client_secret: Deno.env.get("MP_CLIENT_SECRET"),
            grant_type: "authorization_code",
            code: body.code,
            redirect_uri: body.redirect_uri,
          }),
        });

        const tokenData = await mpRes.json();
        if (!mpRes.ok) return new Response(JSON.stringify({ error: tokenData }), { status: mpRes.status, headers });

        // Update payment provider settings (Public settings)
        const { error: updateSettingsErr } = await supabase.from("store_settings").update({
          payment_provider: "mercadopago",
          pix_key: null,
          requires_payment_proof: false,
        }).eq("store_id", body.store_id);

        if (updateSettingsErr) {
          console.error("Update settings error:", updateSettingsErr);
          return new Response(JSON.stringify({ error: updateSettingsErr }), { status: 500, headers });
        }

        // Store tokens securely in store_secrets (Private secrets)
        const { error: updateSecretsErr } = await supabase.from("store_secrets").upsert({
          store_id: body.store_id,
          mp_user_id: String(tokenData.user_id),
          mp_token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          mp_access_token: tokenData.access_token,
          mp_refresh_token: tokenData.refresh_token
        }, { onConflict: "store_id" });

        if (updateSecretsErr) {
          console.error("Update secrets error:", updateSecretsErr);
          return new Response(JSON.stringify({ error: updateSecretsErr }), { status: 500, headers });
        }

        return new Response(JSON.stringify({ ok: true }), { headers });
      }
      
      if (body.action === "disconnect") {
        const { error: updateSettingsErr } = await supabase.from("store_settings").update({
          payment_provider: "manual",
        }).eq("store_id", body.store_id);

        if (updateSettingsErr) {
          console.error("Disconnect settings error:", updateSettingsErr);
          return new Response(JSON.stringify({ error: updateSettingsErr }), { status: 500, headers });
        }

        const { error: updateSecretsErr } = await supabase.from("store_secrets").update({
          mp_user_id: null,
          mp_token_expires_at: null,
          mp_access_token: null,
          mp_refresh_token: null
        }).eq("store_id", body.store_id);

        if (updateSecretsErr) {
          console.error("Disconnect secrets error:", updateSecretsErr);
          return new Response(JSON.stringify({ error: updateSecretsErr }), { status: 500, headers });
        }

        return new Response(JSON.stringify({ ok: true }), { headers });
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });
  } catch (e) {
    console.error("Function error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
});
