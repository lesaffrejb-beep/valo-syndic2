/**
 * Index des services de données locales
 */

export {
    searchDPEByAddress,
    getDPEStatsByPostalCode,
    type DPEEntry,
    type DPESearchResult,
} from "./dpeLocalService";

export {
    searchBDNBByParcel,
    searchBDNBByPostalCode,
    getBDNBStatsByPostalCode,
    formatBDNBInfo,
    type BDNBBuilding,
    type BDNBSearchResult,
} from "./bdnbLocalService";
