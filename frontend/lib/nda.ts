export type PartyInfo = {
  company: string;
  printName: string;
  title: string;
  noticeAddress: string;
};

export type MndaTermType = "expires" | "perpetual";
export type ConfidentialityTermType = "term" | "perpetual";

export type NdaFormData = {
  purpose: string;
  effectiveDate: string; // ISO date (yyyy-mm-dd)
  mndaTermType: MndaTermType;
  mndaTermYears: number;
  confidentialityTermType: ConfidentialityTermType;
  confidentialityTermYears: number;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  party1: PartyInfo;
  party2: PartyInfo;
};

const emptyParty: PartyInfo = {
  company: "",
  printName: "",
  title: "",
  noticeAddress: "",
};

export function createDefaultNdaFormData(): NdaFormData {
  return {
    purpose:
      "Evaluating whether to enter into a business relationship with the other party.",
    effectiveDate: new Date().toISOString().slice(0, 10),
    mndaTermType: "expires",
    mndaTermYears: 1,
    confidentialityTermType: "term",
    confidentialityTermYears: 1,
    governingLaw: "",
    jurisdiction: "",
    modifications: "",
    party1: { ...emptyParty },
    party2: { ...emptyParty },
  };
}

export function orPlaceholder(value: string, placeholder: string): string {
  return value.trim() ? value.trim() : placeholder;
}

export function formatEffectiveDate(isoDate: string): string {
  if (!isoDate) return "[Today's date]";
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "[Today's date]";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
