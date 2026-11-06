import type { Vehicle } from "@/lib/engine/types";
import { CarIcon } from "./Logo";

import { FUEL_LABEL, GEARBOX_LABEL, fmtDateFr } from "@/lib/engine/labels";
export { FUEL_LABEL, GEARBOX_LABEL, fmtDateFr };

export function VehicleCard({ vehicle, badge }: { vehicle: Vehicle; badge?: string }) {
  if (vehicle.pending) {
    return (
      <section className="bg-white border border-line rounded-[20px] p-6 sm:p-7 flex flex-wrap gap-5 items-center" data-testid="vehicle-pending">
        <span className="w-16 h-16 rounded-2xl bg-ink flex items-center justify-center shrink-0"><CarIcon stroke="var(--accent)" size={34} /></span>
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-xs font-semibold text-oktext flex items-center gap-1.5"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>{vehicle.plate ? "Plaque valide" : "Numéro VIN valide"}</span>
          <span className="display text-xl sm:text-[26px] font-bold leading-tight tracking-[1.5px]">{vehicle.plate ?? vehicle.vin}{vehicle.make ? <span className="text-muted font-semibold tracking-normal text-lg"> · {vehicle.make}</span> : null}</span>
          <span className="text-[13px] text-[#4B5563] max-w-[60ch]">Le véhicule est identifié juste après le paiement. Vérifiez bien {vehicle.plate ? "la plaque (case A de la carte grise)" : "le VIN (case E de la carte grise)"} : le rapport est produit pour celle-ci. Si aucun véhicule ne correspond, vous êtes remboursé automatiquement.</span>
        </div>
      </section>
    );
  }
  const chips = [vehicle.plate, FUEL_LABEL[vehicle.fuel], GEARBOX_LABEL[vehicle.gearbox], vehicle.powerHp ? `${vehicle.powerHp} ch` : "", vehicle.firstRegistration ? `1re immat. ${fmtDateFr(vehicle.firstRegistration)}` : ""].filter(Boolean);
  return (
    <section className="bg-white border border-line rounded-[20px] p-6 sm:p-7 flex flex-wrap gap-5 items-center justify-between">
      <div className="flex gap-5 items-center min-w-0">
        <span className="w-16 h-16 rounded-2xl bg-ink flex items-center justify-center shrink-0"><CarIcon stroke="var(--accent)" size={34} /></span>
        <div className="flex flex-col gap-1.5 min-w-0">
          {badge && <span className="text-xs font-semibold text-oktext flex items-center gap-1.5"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>{badge}</span>}
          <span className="display text-xl sm:text-[26px] font-bold leading-tight">{vehicle.make} {vehicle.model}{vehicle.version ? ` ${vehicle.version}` : ""}</span>
          <div className="flex flex-wrap gap-2 text-[13px] font-medium text-[#4B5563]">
            {chips.map((c, i) => <span key={i} className={`px-2.5 py-1 rounded-lg ${i === 0 && vehicle.plate ? "bg-ground font-bold tracking-[1.5px] text-navy" : "bg-ground"}`}>{c}</span>)}
            {vehicle.imported && <span className="px-2.5 py-1 rounded-lg bg-warnbg text-warntext">Importé</span>}
            {vehicle.country !== "FR" && <span className="px-2.5 py-1 rounded-lg bg-warnbg text-warntext">Immatriculé hors France ({vehicle.country})</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
