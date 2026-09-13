import { describe, it, expect } from "vitest";
import {
  calculateDistance,
  calculateDeliveryFee,
  normalizeState,
} from "@/lib/distance";
import type { DeliveryZone } from "@/types/database";

describe("Freight Engine Unit & Boundary Tests", () => {
  describe("1. Distance Calculation (Haversine Formula)", () => {
    it("should calculate zero distance when coordinates are identical", () => {
      const dist = calculateDistance(-23.55052, -46.633308, -23.55052, -46.633308);
      expect(dist).toBe(0);
    });

    it("should calculate accurate distance between SP Praça da Sé and MASP Paulista (~2.5km)", () => {
      const dist = calculateDistance(-23.5505, -46.6333, -23.5614, -46.6559);
      expect(dist).toBeGreaterThan(2.3);
      expect(dist).toBeLessThan(2.7);
    });
  });

  describe("2. Local Delivery Fee Calculation Engine (calculateDeliveryFee)", () => {
    const mockZoneManual: DeliveryZone = {
      id: "zone-1",
      store_id: "store-1",
      name: "Zona Centro",
      pricing_type: "manual",
      max_distance_km: 15,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const mockPricingRanges = [
      { min_distance_km: 0, max_distance_km: 5, price_cents: 1000 },
      { min_distance_km: 5, max_distance_km: 10, price_cents: 1500 },
      { min_distance_km: 10, max_distance_km: 20, price_cents: 2500 },
    ];

    it("should match exact manual pricing range for 3km", () => {
      const fee = calculateDeliveryFee(3.0, null, mockZoneManual, mockPricingRanges);
      expect(fee).toBe(1000);
    });

    it("should match middle range at exact lower boundary 5.0km", () => {
      const fee = calculateDeliveryFee(5.0, 10, mockZoneManual, mockPricingRanges);
      expect(fee).toBe(1500);
    });

    it("should return null if distance exceeds all pricing ranges", () => {
      const fee = calculateDeliveryFee(25.0, 30, mockZoneManual, mockPricingRanges);
      expect(fee).toBeNull();
    });

    const mockZoneAuto: DeliveryZone = {
      id: "zone-auto",
      store_id: "store-1",
      name: "Zona Automática",
      pricing_type: "auto",
      auto_base_fee_cents: 500, // R$ 5,00 base
      auto_price_per_km_cents: 200, // R$ 2,00 / km
      auto_price_per_min_cents: 50, // R$ 0,50 / min
      auto_multiplier: 1.2, // 20% surge multiplier
      auto_min_fee_cents: 1200, // Minimum R$ 12,00
      max_distance_km: 30,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    it("should calculate automatic fee correctly with base + km + duration * multiplier", () => {
      // 10km, 20min
      // Calc: 500 + (10 * 200) + (20 * 50) = 500 + 2000 + 1000 = 3500 cents
      // Multiplier 1.2 => 3500 * 1.2 = 4200 cents (R$ 42,00)
      const fee = calculateDeliveryFee(10.0, 20, mockZoneAuto, []);
      expect(fee).toBe(4200);
    });

    it("should enforce minimum fee in automatic mode if calculated fee is below min_fee", () => {
      // 1km, 2min
      // Calc: 500 + (1 * 200) + (2 * 50) = 800 cents. 800 * 1.2 = 960 cents.
      // Min fee is 1200 cents (R$ 12,00)
      const fee = calculateDeliveryFee(1.0, 2, mockZoneAuto, []);
      expect(fee).toBe(1200);
    });
  });

  describe("3. Address Normalization Utilities", () => {
    it("should normalize full Brazilian state names to 2-letter postal abbreviation", () => {
      expect(normalizeState("São Paulo")).toBe("SP");
      expect(normalizeState("Rio de Janeiro")).toBe("RJ");
      expect(normalizeState("Tocantins")).toBe("TO");
      expect(normalizeState("mg")).toBe("MG");
    });
  });
});
