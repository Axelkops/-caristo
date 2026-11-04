import { describe, expect, it } from "vitest";
import { parseDate, parseFormulaNumber, parseMileage, parsePlate, parseVin, vinCheckDigit, vinModelYear } from "@/lib/engine/identifiers";

describe("plaques", () => {
  it("reconnaît le format SIV français sous toutes ses écritures", () => {
    for (const v of ["AB-123-CD", "ab 123 cd", "AB123CD", " ab-123-cd "]) {
      const p = parsePlate(v);
      expect(p?.normalized).toBe("AB-123-CD");
      expect(p?.country).toBe("FR");
    }
  });
  it("refuse les lettres interdites en SIV (I, O, U)", () => {
    expect(parsePlate("AI-123-CD")?.format).not.toBe("FR_SIV");
  });
  it("reconnaît l'ancien format FNI", () => {
    expect(parsePlate("1234 AB 56")?.format).toBe("FR_FNI");
    expect(parsePlate("123 ABC 75")?.format).toBe("FR_FNI");
  });
  it("reconnaît des plaques européennes", () => {
    expect(parsePlate("B-AB 1234")?.country).toBe("DE");
    expect(parsePlate("1234 BCD")?.country).toBe("ES");
    expect(parsePlate("1-ABC-123")?.country).toBe("BE");
    expect(parsePlate("AB12 CDE")?.country).toBe("GB");
  });
  it("rejette n'importe quoi", () => {
    expect(parsePlate("")).toBeNull();
    expect(parsePlate("hello world!!")).toBeNull();
  });
});

describe("VIN", () => {
  it("valide un VIN correct et décode l'année", () => {
    const v = parseVin("VF3MCYHZRKS004821");
    expect(v?.valid).toBe(true);
    expect(v?.region).toBe("Europe");
    expect(v?.wmi).toBe("VF3");
  });
  it("refuse les VIN trop courts ou avec I/O/Q", () => {
    expect(parseVin("ABC")).toBeNull();
    expect(parseVin("VF3MCYHZRKS00482I")?.valid).toBe(false);
  });
  it("vérifie la clé des VIN nord-américains", () => {
    expect(vinCheckDigit("1HGCM82633A004352")).toBe(true);
    expect(vinCheckDigit("1HGCM82633A004353")).toBe(false);
    expect(vinCheckDigit("VF3MCYHZRKS004821")).toBeNull();
  });
  it("décode l'année modèle", () => {
    expect(vinModelYear("K")).toBe(2019);
    expect(vinModelYear("L")).toBe(2020);
  });
});

describe("carte grise et saisies", () => {
  it("valide le numéro de formule", () => {
    expect(parseFormulaNumber("2021AB12345")).toBe("2021AB12345");
    expect(parseFormulaNumber("2021 ab 12345")).toBe("2021AB12345");
    expect(parseFormulaNumber("12345")).toBeNull();
  });
  it("valide les dates", () => {
    expect(parseDate("12/03/2019")).toBe("2019-03-12");
    expect(parseDate("2019-03-12")).toBe("2019-03-12");
    expect(parseDate("31/02/2019")).toBeNull();
    expect(parseDate("12/03/2099")).toBeNull();
  });
  it("valide le kilométrage", () => {
    expect(parseMileage("118 000")).toBe(118000);
    expect(parseMileage("118000 km")).toBe(118000);
    expect(parseMileage(-5)).toBeNull();
    expect(parseMileage("abc")).toBeNull();
  });
});
