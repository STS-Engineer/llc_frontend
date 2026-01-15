import React, { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// ================== API ==================
const API = "http://localhost:3001/api";

// =============================================
// ✅ Plant & Validator mapping (exact strings)
// =============================================
const PLANT_VALIDATOR = {
  "TEST Plant": "ons.ghariani@avocarbon.com",
  "FRANKFURT Plant": "dagmar.ansinn@avocarbon.com",
  "KUNSHAN Plant": "allan.riegel@avocarbon.com",
  "MONTERREY Plant": "hector.olivares@avocarbon.com",
  "CHENNAI Plant": "sridhar.b@avocarbon.com",
  "SCEET Plant": "imed.benalaya@avocarbon.com",
  "ANHUI Plant": "samtak.joo@avocarbon.com",
  "CYCLAM Plant": "florence.paradis@avocarbon.com",
  "TIANJIN Plant": "yang.yang@avocarbon.com",
  "SAME Plant": "salah.benachour@avocarbon.com",
  "POITIERS Plant": "sebastien.charpentier@avocarbon.com",
};

// ================ OPTIONS ================
const OPTIONS = {
  category: ["Process & Maintenance", "Quality", "CIP"],
  llc_type: ["Quality", "Delivery", "Management", "Design", "Safety", "Commercial", "Supplier", "APQP Projects", "Pre-Sales Projects", "HR", "Development", "CIP", "Project"],
  customer: ["VALEO","INTEVA","DENSO","NIDEC","MAHLE","HELLA","HAYWARD","ADVIK","DOLZ","E-MOTOR","BMW","VW","PHINIA","BOSCH POWERTOOL","STANLEY - BLACK AND DECKER","RUIDONG","BOSCH","BYD","KOSTAL","OTHER","DY AUTO","SOGEFI","RENAULT","MIMZHEN","BORGWARNER","TESLA","BROSE","US MOTOR WORKS","AUDI","SPEK","PIERBURG","ELEKTRA","BUEHLER","CEBI","SCHAEFFLER","MAKITA","EDHK","KSB","FOSHAN","PEDROLLO","INDISA","TTI (DongGuan)","ECKERLE","HERITAGE","XYLEM","FARWON GUANZHOU","QIANGRUN LISHUI","XUHONG","AVO INDIA","SHANGHAN YONGXIN","SC ELECTRONIC","HONGFA XIAMEN","JIANGKOU TAISHAN","WKK","US MOTORWORKS","MABUCHI","CCL SHENZHEN","GLOYEL","KINGCLEAN","HUIJIN HANG","KEIK","AMETEK REYNOSA","SB&D REYNOSA","MIMZEN","YUDA","GiMuTe","CLSK","NANJING BOSHILANG","SHUANG HANG","ALLSUN","DAEDONG MOVEL","ZHEJIANG YONGXIN TAIZHOU","LISHUI SHUANGLIYAN","NINGBO TIANLONG","BAISHIJANG","MAPARTEL","YUNHUI JINHUA","KELI","ZHEJIANG ZHISEN","COSWORTH","AIRTEX","CGW","SHAO XING HISTREN MOTOR","SUZHOU SHUANGHANG","KEYANG","AVO KOREA","DONGGUAN CHANGJINCHENG","JINJIA","UAES","CHANGZHOU WUJIN","DMEGC","CF GROUP","TAMAS","QUAX PUMPS","YANFENG ADIENT","ADTECH21","KAIZHONG","JIANGXI DONGJIANG", "SUNGJIN","YUNYI","LANGXIN","HANGZHOU XIANGBIN","RUIAN HANTIAN","KANGDA","LUXSHARE-ICT ChANGSHU","NINGBO HUIJIATE","JINCHENG MIKUNI","FEILONG","ACHR","BEIGONG WENZHOU","CROWN","CHONGQING JILI YUNFENG","TI FLUID SYSTEM","LUCAS TVS","LUXSHARE ICT","PRICOL","UCAL FUEL SYSTEMS","LAXMI DRUCKEN KOMPONENTS","CUMMINS INDIA","DOGA","V-GUARD APPLIANCES","ELECTROMAG","JOHNSON ELECTRIC","HYOSEONG ELECTRIC","HENGTE AUTOMOTIVE","ELECTROCRAFT","PREH","ELIN","PV CLEAN MOBILITY","PARS KHAZAR NOGHREH","HEXAGONE MANUFACTURE","GACC","FOCUSTEK MANUFACTURING","AISIN AUTOMOTIVE","IGARASHI MOTORS","MYUNGHWA AUTOMOTIVE","BETTER CARRY","BüHLER MOTOR","BOSS APPLIANCES LLC","SFL AUTOLEC DIVISION","SHASWATHI PLASTICS","AUTO IGNITION","KINETIC TAIGENE ELECTRICAL","ETTEHAD MOTORS","UTTAM POWER TOOLS","DONGGUAN COUNTRY DREAM MOTOR","TBK INDIA PVT","AUTOLITE","PRABHA ENGINEERING","OTTER CONTROLS","CHUANG JIDIAN","HYUNDAI","SEG AUTOMOTIVE","SENATLA EV COMP","VARROC","IFB AUTOMOTIVE","PRESTOLIE","ADITYA AUTO","SRI BALAJI INDUSTRIES","FLASH ElECTRONICS","RAJAMANE INDUSTRIES","PREBO AUTOMOTIVE","LEGGETT & PLATT","MITSUBA SICAL","SOOYAB SANAT","LEPSE","EFAFLU","TVS SENSING SOLUTIONS","SHENZHEN ECMOVO","COMSTAR AUTOMOTIVE TECHNOLOGIES","LG MAGNA","DONGJIN MOTOR","NUCON AEROSPACE","YOUNG SHIN","MOBIS","WINWORLD AUTOMOTIVE","TATA AUTOCOMP","MITTAL ELECTRONICS","NANJING SHENGJIE MOTOR","SONALIKA TRACTORS","PRANAV VICAS","FLOW OIL PUMPS","OLA ELECTRIC TECHNOLOGIES","CINDERSON TECH","PISCINES DESJOYAUX","VITESCO","ZF FRIEDRICHSHAFEN","TRICO","TMG","FORVIA","MAXON MOTOR","MELCO","MAN ES","MITSUBISHI","Wuxi MI TECHNOLOGIES CO.LTD","Add","SPECK","SPECK USA","ESPA SPAIN","EBARA","DAB PUMPS","WILO","KRIPSOL","PROCOPI","META SYSTEM","VOLKSWAGEN","ALL CIRCUIT","SIAME","SENIX TOOLS","ASTEELFLASH","BCS AIS","MARELLI","LA PRATIQUE ELECTRONIQUE","DIEHL CONTROLS","HILTI","FOXCONN MX","FAURECIA","Global YDK - Noida","KEN PT","MAGNA","DUOBAO","Shenzhen Xinhua","ANU INDUSTRIES","DEXIN","MIDEA","LESHI","Mando","Founder","LEFOO","ROCKET","CALEB","SEAYANG","LINIX","LACROIX ELECTRONICS","YUANYI","LIANKE","VT shanghai","ARV AUTO","ZHUOREN","FORTEQ","ZOREN","MASTERY","TOPBAND MEXICO","TMK","YAMAHA MOTOR","INDUSTRIAS VAGO DE MEXICO","AMPLE","SALERI","BARMESA PUMPS","Bharath Seats","VERTEX GLOBAL","RBCC","HUAHUI","RUNXIN","JE India","TAEHWA India","BOMEYU","INOVANCE","GENERAL CAB","DEFOND","FPC","Suzhou iBoss","PACKO","COMPLEO","DHJ","Kolektor","CT Machine","Midwest","Welling","KEYTRONIC","MIND","ROOTS INDUSTRIES","RIYONG","EMP Concentric","KEDU","BORMAN","Zhejiang NBT","YI XIN","REVEE","ABB","SCANIA","HITACHI","VERSUNI","MinebeaMitsumi","HANYU","FUJI CARBON","BUNDY INDIA LTD","OHIO ELECTRIC MOTORS","FULLING & CORPORATION LTD","Fujian Huian Jiangu electrical machinery Co., Ltd","BUHLER","XYZ","Ningbo Huade","AVO Mexico","Xingdesheng","NEWELL (OSTER SUNBEAM)","ZHANGJIAGANG LANGXIN","Ningbo Jingcheng","Suprajit engineering","stove kraft - bangalore","BITRON","shenzhen wanzhida","LEGEL&PLATT","Sun-Wa Technos (H.K.)","Ningbo Mimzen","RUNFUNG","Ningbo Linjian Intelligence Technology","Ji'Ou","KAV","Electro Parts","Ningbo Dechang Tech Co.,ltd","SICHUAN FUSHENG AUTO PARTS CO.,LTD","Housheng","MI TECHNOLOGY","Suzhou North Continent Auto Parts Ltd","Endowa","gilkes","Bergstrom","YF Adient Founder","Stanley Black and Deckar","Pure Carbon India PVT LTD","Lucas PADI","Pettl","Purflux","Yuyao Chili Motor Co.,ltd","Electro Motor","Wolong Electric industial Motors","SONEDE TN","Huade Holding Groupe","Xixia","suv","Suvidha","SEMENS","Thermax","Lames 2.3 mm"],
  product_type: ["Brush Auxiliary","Brush Micro-Brushes","Brush Starter single layer","Brush Starter dual layer","Brush Fuel pump","Brush Fuel pump carbon disk","Brush Grounding","Assembly Brush Holder","Assembly Wire harness","Assembly Electronics","Choke Rod Chokes","Choke Fuse Chokes","Choke Toroid Chokes","Choke Transformers","Seal Automotive","Seal General Industry","Seal Pool","Seal Clean Water","Seal Irrigation","Seal Washing Machine","Injection Simple injection","Injection Insert molding","Injection Insert Slip ring","Friction Thermoset Bushing","Friction Thermoplastic Bushing","Friction Bushing","Friction Rotor & Blades","Metal ring"],
  quality_detection: ["All", "Validation failure", "Final inspection", "Line inspection", "Customer Claim", "Waranty incident", "Internal test", "Add an origine"],
  application_label: ["All","Wiper-Motor","Alternators","Starter motor","Electronics","Electric pumps","Dynamic Sealing","Micro-Motors","Traction","FHP","Comfort and auxiliary motors","Power tools","Home appliances and Consumer products"],
  product_line_label: ["All","Assembly","Injection","Chokes","Brushes","Seals"],
  editor: ["Editor 1", "Editor 2", "Editor 3"],
  plant: ["SCEET Plant","POITIERS Plant","AMIENS Plant","FRANKFURT Plant","MONTERREY Plant","CHENNAI Plant","TIANJIN Plant","ANHUI Plant", "KUNSHAN Plant"],
  failure_mode: ["Lack of continuity","High resistance","Low resistance","Low peel force","High noise","Tin thickness to thick","Tinning thickness to low","Poor brush sliding","Low pull Force","Brush thickness oversize","poor or lack leg welding","Bad laser welding extraction force","Damage","Leg Misalignment","QR code","Lack of solder","Welding","Dimension oversize","Mixed","Glue on choke legs","Cleanness","Cannot stuck the smoke","Legs deformed","Missing operation","Core fallen off","bad peeling lenth","Not selected as a supplier","Scope management","Cost mamagement","Schedule management","Integration management","Stakeholders management","communication management","Quality management","Resource management","Procurement management","Customer satisfaction","Change management","CIP"],
  validator: ["Validator 1", "Validator 2", "Validator 3", "Validator 4", "Validator 5", "Validator 6", "Validator 7", "Validator 8", "Validator 9", "Validator 10", "Validator 11", "Validator 12"],
  process: ["Material weighing","Mixing","Powder sizing","Powder grinding","Seiving","Pressing","Wire cutting","Curing","Drilling","Grinding","Tamping","Crimping","Welding","End Fusing","Soldering","Heat staking","Cutting","Testing","Assembly","Bending","Stripping","Winding","Gluing","Injection","Tooling","Assembly by manual","Inspection frequency","Pre-launch process","Change Management"],
  origin: ["Process", "Product design", "Discipline", "Organization", "Mindset", "Standard", "Supplier", "Lack of analysis", "Methodology", "Welding", "Skill"],
};


// ================ ICONS ================
const Icons = {
  Upload: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Trash: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
  Plus: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Check: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  AlertCircle: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  File: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  X: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Loader: ({ className }) => (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  ),
  Edit: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  ),
  Chevron: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  Search: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
};

// ================ VALIDATION ================
const RootCauseSchema = z.object({
  id: z.any().optional(), // ✅ allow id in edit
  root_cause: z.string().min(1),
  detailed_cause_description: z.string().min(1).max(2000),
  solution_description: z.string().min(1).max(2000),
  conclusion: z.string().min(1).max(2000),
  process: z.string().min(1),
  origin: z.string().min(1),
});

const LlcSchema = z.object({
  category: z.string().min(1),
  problem_short: z.string().min(1),
  problem_detail: z.string().min(1).max(2000),

  llc_type: z.string().min(1),
  customer: z.string().min(1),
  product_family: z.string().min(1),
  product_type: z.string().min(1),

  quality_detection: z.string().min(1),
  application_label: z.string().min(1),
  product_line_label: z.string().min(1),
  part_or_machine_number: z.string().min(1),

  editor: z.string().min(1),
  plant: z.string().min(1),
  validator: z.string().min(1),

  failure_mode: z.string().min(1),
  conclusions: z.string().min(1).max(2000),

  rootCauses: z.array(RootCauseSchema).min(1),
});

// ================ ANIMATIONS CSS ================
const globalStyles = `
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
.animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
.animate-scale-in { animation: scaleIn 0.3s ease-out forwards; }
.stagger-1 { animation-delay: 0.1s; }
.stagger-2 { animation-delay: 0.2s; }
`;
if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = globalStyles;
  document.head.appendChild(styleEl);
}

// ================ UI HELPERS ================
function Label({ children, required }) {
  return (
    <label className="flex items-center gap-1 text-sm font-semibold text-[#0e4e78] mb-2">
      <span>{children}</span>
      {required && <span className="text-red-500 text-base">*</span>}
    </label>
  );
}

function ReadOnlyField({ label, required, value, help }) {
  const box = `
    w-full rounded-xl border border-[#c5c5c4] bg-[#f8fafc]
    px-4 py-3 text-sm text-[#585858]
  `;
  return (
    <div>
      <Label required={required}>{label}</Label>
      <div className={box}>{value || "—"}</div>
      {help ? <p className="mt-2 text-xs text-red-600">{help}</p> : null}
    </div>
  );
}

function Counter({ value, max = 2000 }) {
  const len = (value || "").length;
  const percentage = (len / max) * 100;
  const isNearLimit = percentage > 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="flex-1 h-1 bg-[#c5c5c4]/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${isAtLimit ? "bg-red-500" : isNearLimit ? "bg-[#ef7807]" : "bg-[#046eaf]"}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${isAtLimit ? "text-red-500" : isNearLimit ? "text-[#ef7807]" : "text-[#585858]"}`}>
        {len} / {max}
      </span>
    </div>
  );
}

// ================ Click Outside ================
function useOnClickOutside(ref, handler, when = true) {
  useEffect(() => {
    if (!when) return;

    const onDown = (e) => {
      const el = ref.current;
      if (!el) return;
      if (el.contains(e.target)) return;
      handler();
    };

    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [ref, handler, when]);
}

// ================ Searchable Select ================
function SearchableSelect({ label, required, options, value, onChange, placeholder = "Select", className = "", dropdownMaxHeight = 240 }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useOnClickOutside(
    wrapRef,
    () => {
      setOpen(false);
      setQuery("");
      setActiveIndex(0);
    },
    open
  );

  const normalized = (s) => (s || "").toString().toLowerCase().trim();

  const filtered = useMemo(() => {
    const q = normalized(query);
    if (!q) return options;
    return options.filter((o) => normalized(o).includes(q));
  }, [options, query]);

  const selectedLabel = value ? value : "";

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  const commit = (val) => {
    onChange?.(val);
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  };

  const scrollIntoView = (idx) => {
    const el = listRef.current?.querySelector(`[data-idx="${idx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  };

  const onKeyDownClosed = (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onKeyDownOpen = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setQuery("");
      setActiveIndex(0);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((p) => {
        const next = Math.min(p + 1, Math.max(filtered.length - 1, 0));
        scrollIntoView(next);
        return next;
      });
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((p) => {
        const next = Math.max(p - 1, 0);
        scrollIntoView(next);
        return next;
      });
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) commit(filtered[activeIndex]);
      return;
    }
  };

  const inputBase = `
    w-full rounded-xl border border-[#c5c5c4] bg-white
    px-4 py-3 text-sm text-[#585858]
    placeholder:text-[#c5c5c4]
    outline-none
    transition-all duration-200
    hover:border-[#046eaf]/50
    focus:border-[#046eaf] focus:ring-4 focus:ring-[#046eaf]/10
  `;

  return (
    <div ref={wrapRef} className="relative">
      {label ? <Label required={required}>{label}</Label> : null}

      <div
        role="combobox"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={open ? onKeyDownOpen : onKeyDownClosed}
        onMouseDown={(e) => {
          e.preventDefault();
          if (!open) setOpen(true);
          else inputRef.current?.focus();
        }}
        className={`${inputBase} ${className} flex items-center gap-3 cursor-text`}
      >
        <span className="text-[#585858] flex items-center pointer-events-none">
          {open ? <Icons.Search className="w-4.5 h-4.5" /> : <Icons.Chevron className="w-4.5 h-4.5" />}
        </span>

        {open ? (
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={selectedLabel ? selectedLabel : placeholder}
            className="flex-1 bg-transparent outline-none text-sm text-[#585858] placeholder:text-[#c5c5c4]"
            onKeyDown={onKeyDownOpen}
          />
        ) : (
          <div className={`flex-1 text-sm ${selectedLabel ? "text-[#585858]" : "text-[#c5c5c4]"} pointer-events-none`}>{selectedLabel || placeholder}</div>
        )}

        <span className={`text-[#585858] transition-transform duration-200 ${open ? "rotate-180" : ""} pointer-events-none`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-[#c5c5c4]/50 bg-white shadow-xl animate-scale-in" style={{ transformOrigin: "top" }}>
          <div ref={listRef} className="max-h-[240px] overflow-auto p-2" style={{ maxHeight: dropdownMaxHeight }}>
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-sm text-[#585858]">
                Aucun résultat pour <span className="font-semibold">{query}</span>
              </div>
            ) : (
              filtered.map((o, idx) => {
                const isActive = idx === activeIndex;
                const isSelected = o === value;
                return (
                  <button
                    type="button"
                    key={o}
                    data-idx={idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      commit(o);
                    }}
                    className={`
                      w-full text-left px-3 py-2.5 rounded-xl text-sm
                      transition-all duration-150
                      ${isActive ? "bg-[#046eaf]/10 text-[#046eaf]" : "text-[#585858] hover:bg-[#046eaf]/5"}
                      ${isSelected ? "font-semibold" : "font-normal"}
                    `}
                  >
                    {o}
                  </button>
                );
              })
            )}
          </div>

          <div className="px-3 py-2 border-t border-[#c5c5c4]/30 text-xs text-[#585858] flex items-center justify-between">
            <span>
              {filtered.length} option{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function RHFSearchableSelect({ control, name, rules, label, required, options, className, placeholder }) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <SearchableSelect label={label} required={required} options={options} value={field.value} onChange={field.onChange} className={className} placeholder={placeholder} />
      )}
    />
  );
}

// ================ UPLOAD LIST ================
function UploadList({ files, setFiles }) {
  const [isOver, setIsOver] = useState(false);

  const addFiles = (incoming) => {
    if (!incoming?.length) return;
    setFiles((prev) => [...prev, ...incoming]);
  };

  const removeAt = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className={`
        relative mt-2 rounded-2xl border-2 border-dashed p-6 transition-all duration-300 ease-out
        ${isOver ? "border-[#046eaf] bg-[#046eaf]/5 scale-[1.01]" : "border-[#c5c5c4] bg-gradient-to-br from-white to-[#f8fafc] hover:border-[#046eaf]/50"}
      `}
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        addFiles(Array.from(e.dataTransfer.files || []));
      }}
    >
      {isOver && <div className="absolute inset-0 rounded-2xl border-2 border-[#046eaf] animate-pulse pointer-events-none" />}

      <div className="flex flex-col items-center gap-4 text-center">
        <div className={`p-4 rounded-2xl transition-all duration-300 ${isOver ? "bg-[#046eaf] text-white scale-110" : "bg-[#046eaf]/10 text-[#046eaf]"}`}>
          <Icons.Upload className="w-8 h-8" />
        </div>

        <div>
          <p className="text-sm font-semibold text-[#0e4e78]">Drag and drop your files here</p>
          <p className="mt-1 text-xs text-[#585858]">or click to browse</p>
        </div>

        <label
          className="
          group relative inline-flex cursor-pointer items-center justify-center gap-2
          rounded-xl bg-gradient-to-r from-[#046eaf] to-[#0e4e78]
          px-5 py-2.5 text-sm font-semibold text-white
          shadow-lg shadow-[#046eaf]/25
          hover:shadow-xl hover:shadow-[#046eaf]/30 hover:scale-105
          active:scale-95
          transition-all duration-200
          focus-within:ring-2 focus-within:ring-[#ef7807] focus-within:ring-offset-2
        "
        >
          <Icons.Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          <span>Choose files</span>
          <input
            hidden
            type="file"
            multiple
            onChange={(e) => {
              addFiles(Array.from(e.target.files || []));
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-2 border-t border-[#c5c5c4]/30 pt-4">
          <p className="text-xs font-medium text-[#585858] mb-3">
            {files.length} file{files.length > 1 ? "s" : ""} selected
          </p>
          {files.map((f, idx) => (
            <div
              key={`${f.name}-${f.size}-${idx}`}
              className="
                group flex items-center gap-3 rounded-xl
                bg-white border border-[#c5c5c4]/50
                px-4 py-3
                hover:border-[#046eaf]/30 hover:shadow-md
                transition-all duration-200
                animate-fade-in-up
              "
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex-shrink-0 p-2 rounded-lg bg-[#046eaf]/10 text-[#046eaf]">
                <Icons.File className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-[#0e4e78]">{f.name}</p>
                <p className="text-xs text-[#585858]">{(f.size / 1024).toFixed(1)} KB</p>
              </div>

              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="
                  p-2 rounded-lg
                  text-[#585858]
                  hover:bg-red-50 hover:text-red-500
                  opacity-0 group-hover:opacity-100
                  transition-all duration-200
                "
                title="Remove"
              >
                <Icons.Trash className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ================ TOASTS ================
function SuccessToast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-50 animate-fade-in-up">
      <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-2xl shadow-emerald-500/30">
        <div className="flex-shrink-0 p-1 rounded-full bg-white/20">
          <Icons.Check className="w-5 h-5" />
        </div>
        <p className="font-medium">{message}</p>
        <button onClick={onClose} className="ml-2 p-1 hover:bg-white/20 rounded-lg transition-colors">
          <Icons.X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ErrorToast({ message, onClose }) {
  return (
    <div className="fixed top-6 right-6 z-50 animate-fade-in-up">
      <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white shadow-2xl shadow-red-500/30">
        <div className="flex-shrink-0 p-1 rounded-full bg-white/20">
          <Icons.AlertCircle className="w-5 h-5" />
        </div>
        <p className="font-medium">{message}</p>
        <button onClick={onClose} className="ml-2 p-1 hover:bg-white/20 rounded-lg transition-colors">
          <Icons.X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ================ ROOT CAUSE MODAL (ADD + EDIT) ================
function RootCauseModal({ open, onClose, mode = "add", initialData, initialFiles, onSave }) {
  const [local, setLocal] = useState({
    id: undefined,
    root_cause: "",
    detailed_cause_description: "",
    solution_description: "",
    conclusion: "",
    process: "",
    origin: "",
  });
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (open) {
      setLocal(
        initialData || {
          id: undefined,
          root_cause: "",
          detailed_cause_description: "",
          solution_description: "",
          conclusion: "",
          process: "",
          origin: "",
        }
      );
      setFiles(initialFiles || []);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, initialData, initialFiles]);

  const inputBase = `
    w-full rounded-xl border border-[#c5c5c4] bg-white
    px-4 py-3 text-sm text-[#585858]
    placeholder:text-[#c5c5c4]
    outline-none
    transition-all duration-200
    hover:border-[#046eaf]/50
    focus:border-[#046eaf] focus:ring-4 focus:ring-[#046eaf]/10
  `;

  const isValid =
    local.root_cause.trim() &&
    local.detailed_cause_description.trim() &&
    local.solution_description.trim() &&
    local.conclusion.trim() &&
    local.process.trim() &&
    local.origin.trim();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#0e4e78]/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl animate-scale-in overflow-hidden">
        <div className="relative px-8 py-6 bg-gradient-to-r from-[#046eaf] to-[#0e4e78]">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
            <Icons.X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-white">{mode === "edit" ? "Edit Root Cause" : "Add Root Cause"}</h2>
          <p className="mt-1 text-sm text-white/80">Fill in all required fields</p>
        </div>

        <form
          className="max-h-[65vh] overflow-auto px-8 py-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isValid) return;
            onSave(local, files);
            onClose();
          }}
        >
          <div className="space-y-6">
            <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <Label required>Root Cause</Label>
              <input className={inputBase} value={local.root_cause} onChange={(e) => setLocal((p) => ({ ...p, root_cause: e.target.value }))} />
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              <Label required>Detailed Cause Description</Label>
              <textarea rows={4} className={inputBase} value={local.detailed_cause_description} onChange={(e) => setLocal((p) => ({ ...p, detailed_cause_description: e.target.value }))} />
              <Counter value={local.detailed_cause_description} />
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <Label required>Solution Description</Label>
              <textarea rows={4} className={inputBase} value={local.solution_description} onChange={(e) => setLocal((p) => ({ ...p, solution_description: e.target.value }))} />
              <Counter value={local.solution_description} />
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
              <Label required>Conclusion</Label>
              <textarea rows={4} className={inputBase} value={local.conclusion} onChange={(e) => setLocal((p) => ({ ...p, conclusion: e.target.value }))} />
              <Counter value={local.conclusion} />
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
              <Label>Files (PDCA/8D/Evidence...)</Label>
              <UploadList files={files} setFiles={setFiles} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <SearchableSelect label="Process" required options={OPTIONS.process} value={local.process} onChange={(v) => setLocal((p) => ({ ...p, process: v }))} />
              <SearchableSelect label="Origin" required options={OPTIONS.origin} value={local.origin} onChange={(v) => setLocal((p) => ({ ...p, origin: v }))} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-[#c5c5c4]/30">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-[#585858] border border-[#c5c5c4] bg-white hover:bg-[#f8fafc] hover:border-[#585858] active:scale-95 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#ef7807] to-[#f59e0b] shadow-lg shadow-[#ef7807]/30 hover:shadow-xl hover:shadow-[#ef7807]/40 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              {mode === "edit" ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ================ SECTION DIVIDER ================
function SectionDivider({ title }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <span className="text-sm font-bold uppercase tracking-wider text-[#046eaf]">{title}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-[#046eaf]/30 to-transparent" />
    </div>
  );
}

// ================ ROOT CAUSE CARD ================
function RootCauseCard({ rootCause, fileCount, index, onRemove, onEdit }) {
  return (
    <div
      className="group relative rounded-2xl border border-[#c5c5c4]/50 bg-white p-5 shadow-sm hover:shadow-lg hover:border-[#046eaf]/30 transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-gradient-to-b from-[#046eaf] to-[#ef7807]" />
      <div className="flex items-start justify-between pl-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-[#046eaf]/10 text-[#046eaf] text-xs font-bold flex items-center justify-center">{index + 1}</span>
            <h4 className="truncate text-sm font-semibold text-[#0e4e78]">{rootCause || `Root Cause #${index + 1}`}</h4>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-[#585858]">
            <span className="flex items-center gap-1">
              <Icons.File className="w-3.5 h-3.5" />
              {fileCount || 0} file{fileCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button type="button" onClick={onEdit} className="p-2 rounded-xl text-[#585858] hover:bg-[#046eaf]/10 hover:text-[#046eaf] transition-all duration-200" title="Edit">
            <Icons.Edit className="w-4 h-4" />
          </button>

          <button type="button" onClick={onRemove} className="p-2 rounded-xl text-[#585858] hover:bg-red-50 hover:text-red-500 transition-all duration-200" title="Delete (UI only)">
            <Icons.Trash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------- Existing files UI ----------------------
function ExistingFilePill({ file, onToggleRemove }) {
  return (
    <button
      type="button"
      onClick={onToggleRemove}
      className={[
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition",
        file.removed ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
      ].join(" ")}
      title={file.removed ? "Will be deleted (click to undo)" : "Click to remove"}
    >
      <Icons.File className="w-4 h-4" />
      <span className="max-w-[220px] truncate">{file.filename}</span>
      <span className="opacity-70">{file.removed ? "REMOVED" : "KEEP"}</span>
    </button>
  );
}

function ExistingFilesBlock({ title, files, onToggleRemove }) {
  if (!files?.length) return null;
  return (
    <div className="mt-3">
      <div className="text-xs font-bold text-[#0e4e78] mb-2">{title}</div>
      <div className="flex flex-wrap gap-2">
        {files.map((f) => (
          <ExistingFilePill key={f.id} file={f} onToggleRemove={() => onToggleRemove(f.id)} />
        ))}
      </div>
      <div className="mt-2 text-[11px] text-[#585858]">
        Clique sur un fichier pour le marquer <b>à supprimer</b> (re-clique pour annuler).
      </div>
    </div>
  );
}

// ================ MAIN EDIT FORM ================
export default function LlcEditTailwind() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [saved, setSaved] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(true);

  const [rcModalOpen, setRcModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // NEW uploads
  const [rootCauseFiles, setRootCauseFiles] = useState({});
  const [badPartFiles, setBadPartFiles] = useState([]);
  const [goodPartFiles, setGoodPartFiles] = useState([]);
  const [situationBeforeFiles, setSituationBeforeFiles] = useState([]);
  const [situationAfterFiles, setSituationAfterFiles] = useState([]);

  // EXISTING attachments
  const [existingLlcAttachments, setExistingLlcAttachments] = useState([]);
  const [existingRootCauseAttachments, setExistingRootCauseAttachments] = useState({});

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const userPlant = user?.plant || "";
  const userEditor = user?.email || user?.name || "";
  const computedValidator = userPlant ? PLANT_VALIDATOR[userPlant] || "" : "";

  const defaultValues = useMemo(
    () => ({
      category: "",
      problem_short: "",
      problem_detail: "",

      llc_type: "",
      customer: "",
      product_family: "",
      product_type: "",

      quality_detection: "",
      application_label: "",
      product_line_label: "",
      part_or_machine_number: "",

      editor: "",
      plant: "",
      failure_mode: "",

      conclusions: "",
      validator: "",

      rootCauses: [],
    }),
    []
  );

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(LlcSchema),
    defaultValues,
    mode: "onBlur",
  });

  useEffect(() => {
    if (userPlant) setValue("plant", userPlant, { shouldValidate: true });
    if (userEditor) setValue("editor", userEditor, { shouldValidate: true });
    if (computedValidator) setValue("validator", computedValidator, { shouldValidate: true });
  }, [userPlant, userEditor, computedValidator, setValue]);

  const { fields, append, remove, update, replace } = useFieldArray({
    control,
    name: "rootCauses",
  });

  const category = watch("category");
  const isQuality = category === "Quality";
  const problemDetail = watch("problem_detail");
  const globalConc = watch("conclusions");

  // Load LLC
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setSubmitError("");

      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`${API}/llc/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(`Failed to load LLC: ${res.status} ${t}`);
        }
        const data = await res.json();

        const canEdit = data.pm_decision === "REJECTED" || data.final_decision === "REJECTED";

        if (!canEdit) {
          throw new Error("This LLC cannot be edited unless PM decision is REJECTED or Final decision is REJECTED.");
        }


        if (!alive) return;

        const llcToForm = {
          category: data.category || "",
          problem_short: data.problem_short || "",
          problem_detail: data.problem_detail || "",

          llc_type: data.llc_type || "",
          customer: data.customer || "",
          product_family: data.product_family || "",
          product_type: data.product_type || "",

          quality_detection: data.quality_detection || "",
          application_label: data.application_label || "",
          product_line_label: data.product_line_label || "",
          part_or_machine_number: data.part_or_machine_number || "",

          editor: userEditor || data.editor || "",
          plant: userPlant || data.plant || "",
          failure_mode: data.failure_mode || "",

          conclusions: data.conclusions || "",
          validator: computedValidator || data.validator || "",

          rootCauses: Array.isArray(data.rootCauses)
            ? data.rootCauses.map((rc) => ({
                id: rc.id,
                root_cause: rc.root_cause || "",
                detailed_cause_description: rc.detailed_cause_description || "",
                solution_description: rc.solution_description || "",
                conclusion: rc.conclusion || "",
                process: rc.process || "",
                origin: rc.origin || "",
              }))
            : [],
        };

        reset(llcToForm);
        replace(llcToForm.rootCauses);

        // existing llc attachments
        const att = Array.isArray(data.attachments) ? data.attachments : [];
        setExistingLlcAttachments(att.map((a) => ({ ...a, removed: false })));

        // existing rc attachments
        const rcAtt = {};
        (Array.isArray(data.rootCauses) ? data.rootCauses : []).forEach((rc) => {
          rcAtt[rc.id] = (Array.isArray(rc.attachments) ? rc.attachments : []).map((a) => ({
            ...a,
            removed: false,
          }));
        });
        setExistingRootCauseAttachments(rcAtt);

        // clear new uploads
        setBadPartFiles([]);
        setGoodPartFiles([]);
        setSituationBeforeFiles([]);
        setSituationAfterFiles([]);
        setRootCauseFiles({});
      } catch (e) {
        setSubmitError(e?.message || "Load failed");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id, reset, replace, userEditor, userPlant, computedValidator]);

  useEffect(() => {
    if (!isQuality) {
      setBadPartFiles([]);
      setGoodPartFiles([]);
    }
  }, [isQuality]);

  const inputBase = `
    w-full rounded-xl border border-[#c5c5c4] bg-white 
    px-4 py-3 text-sm text-[#585858] 
    placeholder:text-[#c5c5c4] 
    outline-none
    transition-all duration-200
    hover:border-[#046eaf]/50
    focus:border-[#046eaf] focus:ring-4 focus:ring-[#046eaf]/10
  `;

  // Toggle remove existing attachments
  const toggleRemoveLlcAttachment = (attId) => {
    setExistingLlcAttachments((prev) => prev.map((a) => (a.id === attId ? { ...a, removed: !a.removed } : a)));
  };
  const toggleRemoveRootCauseAttachment = (rcId, attId) => {
    setExistingRootCauseAttachments((prev) => {
      const list = prev[rcId] || [];
      return { ...prev, [rcId]: list.map((a) => (a.id === attId ? { ...a, removed: !a.removed } : a)) };
    });
  };

  const existingByScope = useMemo(() => {
    const by = { BAD_PART: [], GOOD_PART: [], SITUATION_BEFORE: [], SITUATION_AFTER: [] };
    for (const a of existingLlcAttachments) {
      if (by[a.scope]) by[a.scope].push(a);
    }
    return by;
  }, [existingLlcAttachments]);

  const openEditRootCause = (idx) => {
    setEditingIndex(idx);
    setRcModalOpen(true);
  };

  // SUBMIT (PUT multipart)
  const onSubmit = async (values) => {
    setSubmitError("");
    setSaved(null);

    try {
      const token = localStorage.getItem("token") || "";
      const { rootCauses, ...llc } = values;

      const deletePayload = {
        llcAttachments: existingLlcAttachments.filter((a) => a.removed).map((a) => a.id),
        rootCauseAttachments: Object.values(existingRootCauseAttachments)
          .flat()
          .filter((a) => a.removed)
          .map((a) => a.id),
        rootCauses: [],
      };

      const formData = new FormData();
      formData.append("llc", JSON.stringify(llc));
      formData.append("rootCauses", JSON.stringify(rootCauses));
      formData.append("delete", JSON.stringify(deletePayload));

      rootCauses.forEach((_, i) => {
        const files = rootCauseFiles[i] || [];
        files.forEach((f) => formData.append(`rootCauseFiles_${i}`, f));
      });

      if (isQuality) {
        badPartFiles.forEach((f) => formData.append("badPartFiles", f));
        goodPartFiles.forEach((f) => formData.append("goodPartFiles", f));
      }

      situationBeforeFiles.forEach((f) => formData.append("situationBeforeFiles", f));
      situationAfterFiles.forEach((f) => formData.append("situationAfterFiles", f));

      const res = await fetch(`${API}/llc/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Save failed");
      }

      setSaved(await res.json());
      setTimeout(() => navigate("/dashboard", { replace: true }), 600);
    } catch (e) {
      setSubmitError(e?.message || "Submit failed");
    }
  };

  if (loading) return <div className="p-8 text-slate-600">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-white to-[#f0f9ff] py-12">
      {saved && <SuccessToast message="Updated!" onClose={() => setSaved(null)} />}
      {submitError && <ErrorToast message={submitError} onClose={() => setSubmitError("")} />}

      <div className="w-full max-w-3xl space-y-6 md:ml-36">
        {/* Header */}
        <div className="rounded-3xl bg-white shadow-xl shadow-[#046eaf]/5 overflow-hidden animate-fade-in-up">
          <div className="relative px-8 py-8 bg-gradient-to-r from-[#046eaf] via-[#0e4e78] to-[#046eaf] bg-[length:200%_100%]">
            <div className="relative flex items-center gap-5">
              <div className="flex h-20 w-24 items-center justify-center rounded-3xl bg-white shadow-lg">
                <img src="/logo.png" alt="Logo" className="h-18 w-18 object-contain" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Edit Quality Lesson Learned #{id}</h1>
                <p className="mt-1 text-m text-white/80">Allowed only if decision is REJECTED</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-4 bg-[#f8fafc] border-b border-[#c5c5c4]/20">
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => navigate(-1)} className="text-sm font-semibold text-slate-700 hover:text-sky-800">
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-3xl bg-white shadow-xl shadow-[#046eaf]/5 overflow-visible animate-fade-in-up stagger-1">
          <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-8">
            <div className="space-y-8">
              <div className="space-y-5">
                <SectionDivider title="Classification" />
                <RHFSearchableSelect control={control} name="category" rules={{ required: true }} label="Category" required options={OPTIONS.category} placeholder="Select category" />
              </div>

              <div className="space-y-5">
                <SectionDivider title="Problem Description" />
                <div>
                  <Label required>Short Problem Description</Label>
                  <input className={inputBase} {...register("problem_short")} />
                </div>
                <div>
                  <Label required>Detailed Problem Description</Label>
                  <textarea rows={6} className={inputBase} {...register("problem_detail")} />
                  <Counter value={problemDetail} />
                </div>
              </div>

              <div className="space-y-5">
                <SectionDivider title="Product Information" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <RHFSearchableSelect control={control} name="llc_type" rules={{ required: true }} label="LLC Type" required options={OPTIONS.llc_type} />
                  <RHFSearchableSelect control={control} name="customer" rules={{ required: true }} label="Customer" required options={OPTIONS.customer} />
                  <div>
                    <Label required>Product Family</Label>
                    <input className={inputBase} {...register("product_family")} />
                  </div>
                  <RHFSearchableSelect control={control} name="product_type" rules={{ required: true }} label="Product Type" required options={OPTIONS.product_type} />
                  <RHFSearchableSelect control={control} name="quality_detection" rules={{ required: true }} label="Quality Detection" required options={OPTIONS.quality_detection} />
                  <RHFSearchableSelect control={control} name="application_label" rules={{ required: true }} label="Application Label" required options={OPTIONS.application_label} />
                  <RHFSearchableSelect control={control} name="product_line_label" rules={{ required: true }} label="Product Line Label" required options={OPTIONS.product_line_label} />
                  <div>
                    <Label required>Part or Machine Number</Label>
                    <input className={inputBase} {...register("part_or_machine_number")} />
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <SectionDivider title="Stakeholders & Location" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <ReadOnlyField label="Editor" required value={userEditor} help={!userEditor ? "No editor found in localStorage.user. Please sign in again." : undefined} />
                  <ReadOnlyField label="Plant" required value={userPlant} help={!userPlant ? "No plant found in localStorage.user. Please sign in again." : undefined} />
                  <RHFSearchableSelect control={control} name="failure_mode" rules={{ required: true }} label="Failure Mode" required options={OPTIONS.failure_mode} />
                </div>
              </div>

              {isQuality && (
                <div className="space-y-5 p-6 rounded-2xl bg-gradient-to-br from-[#046eaf]/5 to-transparent border border-[#046eaf]/20 animate-fade-in">
                  <SectionDivider title="Part Comparison (Quality)" />

                  <ExistingFilesBlock title="Existing BAD_PART attachments" files={existingByScope.BAD_PART} onToggleRemove={toggleRemoveLlcAttachment} />
                  <ExistingFilesBlock title="Existing GOOD_PART attachments" files={existingByScope.GOOD_PART} onToggleRemove={toggleRemoveLlcAttachment} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label>Bad Part (add new)</Label>
                      <UploadList files={badPartFiles} setFiles={setBadPartFiles} />
                    </div>
                    <div>
                      <Label>Good Part (add new)</Label>
                      <UploadList files={goodPartFiles} setFiles={setGoodPartFiles} />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <SectionDivider
                    title={
                      <>
                        Root Cause<span className="text-red-500"> *</span>
                      </>
                    }
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEditingIndex(null);
                      setRcModalOpen(true);
                    }}
                    className="
                      inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                      text-sm font-semibold text-white
                      bg-gradient-to-r from-[#ef7807] to-[#f59e0b]
                      shadow-lg shadow-[#ef7807]/25
                      hover:shadow-xl hover:shadow-[#ef7807]/30 hover:scale-105
                      active:scale-95
                      transition-all duration-200
                    "
                  >
                    <Icons.Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>

                {fields.length === 0 ? (
                  <div className="text-center py-12 rounded-2xl border-2 border-dashed border-[#c5c5c4] bg-[#f8fafc]">
                    <div className="inline-flex p-4 rounded-2xl bg-[#046eaf]/10 text-[#046eaf] mb-4">
                      <Icons.AlertCircle className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-medium text-[#0e4e78]">No root cause added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fields.map((f, idx) => (
                      <div key={f.id}>
                        <RootCauseCard
                          index={idx}
                          rootCause={watch(`rootCauses.${idx}.root_cause`)}
                          fileCount={(rootCauseFiles[idx]?.length || 0) + (existingRootCauseAttachments[f.id]?.length || 0)}
                          onRemove={() => {
                            remove(idx);
                            setRootCauseFiles((prev) => {
                              const next = {};
                              Object.keys(prev).forEach((k) => {
                                const i = Number(k);
                                if (i < idx) next[i] = prev[i];
                                else if (i > idx) next[i - 1] = prev[i];
                              });
                              return next;
                            });
                          }}
                          onEdit={() => openEditRootCause(idx)}
                        />

                        {f.id && existingRootCauseAttachments[f.id]?.length ? (
                          <div className="ml-4 mt-2">
                            <ExistingFilesBlock
                              title="Existing Root Cause attachments"
                              files={existingRootCauseAttachments[f.id]}
                              onToggleRemove={(attId) => toggleRemoveRootCauseAttachment(f.id, attId)}
                            />
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <SectionDivider title="Conclusions & Results" />
                <div>
                  <Label required>General Conclusions</Label>
                  <textarea rows={5} className={inputBase} {...register("conclusions")} />
                  <Counter value={globalConc} />
                </div>

                <ExistingFilesBlock title="Existing SITUATION_BEFORE attachments" files={existingByScope.SITUATION_BEFORE} onToggleRemove={toggleRemoveLlcAttachment} />
                <ExistingFilesBlock title="Existing SITUATION_AFTER attachments" files={existingByScope.SITUATION_AFTER} onToggleRemove={toggleRemoveLlcAttachment} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label>Situation Before (add new)</Label>
                    <UploadList files={situationBeforeFiles} setFiles={setSituationBeforeFiles} />
                  </div>
                  <div>
                    <Label>Situation After (add new)</Label>
                    <UploadList files={situationAfterFiles} setFiles={setSituationAfterFiles} />
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <SectionDivider title="Validation" />
                <ReadOnlyField label="Validator" required value={computedValidator} help={userPlant && !computedValidator ? `No validator configured for: ${userPlant}` : undefined} />
              </div>

              <div className="pt-6 border-t border-[#c5c5c4]/30 flex justify-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting || !userPlant || !userEditor || !computedValidator}
                  className="
                    px-8 py-3 rounded-xl
                    text-sm font-semibold text-white
                    bg-gradient-to-r from-[#046eaf] to-[#0e4e78]
                    shadow-lg shadow-[#046eaf]/25
                    hover:shadow-xl hover:shadow-[#046eaf]/30 hover:scale-105
                    active:scale-95
                    disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
                    transition-all duration-200
                    flex items-center justify-center gap-2
                  "
                >
                  {isSubmitting ? (
                    <>
                      <Icons.Loader className="w-4 h-4" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icons.Check className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>

                <button type="button" onClick={() => navigate(-1)} className="px-8 py-3 rounded-xl text-sm font-semibold border border-[#c5c5c4] bg-white hover:bg-[#f8fafc]">
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <RootCauseModal
        open={rcModalOpen}
        onClose={() => {
          setRcModalOpen(false);
          setEditingIndex(null);
        }}
        mode={editingIndex === null ? "add" : "edit"}
        initialData={editingIndex === null ? undefined : watch(`rootCauses.${editingIndex}`)}
        initialFiles={editingIndex === null ? [] : rootCauseFiles[editingIndex] || []}
        onSave={(rc, files) => {
          if (editingIndex === null) {
            const newIndex = fields.length;
            append(rc);
            setRootCauseFiles((prev) => ({ ...prev, [newIndex]: files }));
          } else {
            update(editingIndex, rc);
            setRootCauseFiles((prev) => ({ ...prev, [editingIndex]: files }));
          }
        }}
      />
    </div>
  );
}
