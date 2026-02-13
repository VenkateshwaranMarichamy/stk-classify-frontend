const sortAlpha = (arr) =>
  arr.slice().sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

export const EMPTY_INDEX = {
  macroOptions: [],
  getSectors: () => [],
  getIndustries: () => [],
  getBasics: () => [],
};

export const normalizeMarketCap = (value) =>
  (value || "").toString().toUpperCase().replace(/\s+/g, "");

export function normalizePayload(raw) {
  if (raw && typeof raw === "object") return raw;
  if (Array.isArray(raw)) return { rows: raw };
  if (Array.isArray(raw?.data)) return { rows: raw.data };
  if (Array.isArray(raw?.results)) return { rows: raw.results };
  return {};
}

export function buildIndex(payload) {
  const macroMap = new Map();

  if (Array.isArray(payload?.macro_economic_sectors)) {
    for (const macro of payload.macro_economic_sectors) {
      const name = macro?.macro_economic_sector?.trim();
      if (name && !macroMap.has(name)) {
        macroMap.set(name, new Map());
      }
    }
  }

  if (
    Array.isArray(payload?.macro_economic_sectors) &&
    Array.isArray(payload?.sectors) &&
    Array.isArray(payload?.industries) &&
    Array.isArray(payload?.basic_industries)
  ) {
    const mesByCode = new Map();
    for (const macro of payload.macro_economic_sectors) {
      if (macro?.mes_code && macro?.macro_economic_sector) {
        mesByCode.set(macro.mes_code, macro.macro_economic_sector.trim());
      }
    }

    const sectorByCode = new Map();
    for (const sector of payload.sectors) {
      if (sector?.sect_code && sector?.sector_name && sector?.mes_code) {
        sectorByCode.set(sector.sect_code, {
          name: sector.sector_name.trim(),
          mesCode: sector.mes_code
        });
      }
    }

    const industryByCode = new Map();
    for (const industry of payload.industries) {
      if (industry?.ind_code && industry?.industry_name && industry?.sect_code) {
        industryByCode.set(industry.ind_code, {
          name: industry.industry_name.trim(),
          sectCode: industry.sect_code
        });
      }
    }

    for (const basic of payload.basic_industries) {
      const basicName = basic?.basic_industry_name?.trim();
      const basicCode = basic?.basic_ind_code?.trim();
      if (!basicName || !basicCode || !basic?.ind_code) continue;

      const industry = industryByCode.get(basic.ind_code);
      if (!industry) continue;

      const sector = sectorByCode.get(industry.sectCode);
      if (!sector) continue;

      const macroName = mesByCode.get(sector.mesCode);
      if (!macroName) continue;

      let sectorMap = macroMap.get(macroName);
      if (!sectorMap) {
        sectorMap = new Map();
        macroMap.set(macroName, sectorMap);
      }

      let industryMap = sectorMap.get(sector.name);
      if (!industryMap) {
        industryMap = new Map();
        sectorMap.set(sector.name, industryMap);
      }

      let basicMap = industryMap.get(industry.name);
      if (!basicMap) {
        basicMap = new Map();
        industryMap.set(industry.name, basicMap);
      }

      if (!basicMap.has(basicName)) {
        basicMap.set(basicName, basicCode);
      }
    }
  } else if (Array.isArray(payload?.rows)) {
    for (const row of payload.rows) {
      const macro = row?.macro_sector?.trim();
      const sector = row?.sector?.trim();
      const industry = row?.industry?.trim();
      const basic = row?.basic_industry?.trim();

      if (!macro || !sector || !industry || !basic) continue;

      let sectorMap = macroMap.get(macro);
      if (!sectorMap) {
        sectorMap = new Map();
        macroMap.set(macro, sectorMap);
      }

      let industryMap = sectorMap.get(sector);
      if (!industryMap) {
        industryMap = new Map();
        sectorMap.set(sector, industryMap);
      }

      let basicMap = industryMap.get(industry);
      if (!basicMap) {
        basicMap = new Map();
        industryMap.set(industry, basicMap);
      }

      if (!basicMap.has(basic)) {
        basicMap.set(basic, basic);
      }
    }
  }

  const macroOptions = sortAlpha(Array.from(macroMap.keys()));

  const getSectors = (macro) => {
    const sectorMap = macroMap.get(macro);
    if (!sectorMap) return [];
    return sortAlpha(Array.from(sectorMap.keys()));
  };

  const getIndustries = (macro, sector) => {
    const sectorMap = macroMap.get(macro);
    const industryMap = sectorMap?.get(sector);
    if (!industryMap) return [];
    return sortAlpha(Array.from(industryMap.keys()));
  };

  const getBasics = (macro, sector, industry) => {
    const sectorMap = macroMap.get(macro);
    const industryMap = sectorMap?.get(sector);
    const basicMap = industryMap?.get(industry);
    if (!basicMap) return [];
    return sortAlpha(Array.from(basicMap.keys())).map((name) => ({
      name,
      code: basicMap.get(name)
    }));
  };

  return { macroOptions, getSectors, getIndustries, getBasics };
}
