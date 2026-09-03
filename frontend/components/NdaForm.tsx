"use client";

import { NdaFormData, PartyInfo } from "@/lib/nda";

type Props = {
  data: NdaFormData;
  onChange: (data: NdaFormData) => void;
};

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
const labelClass = "block text-sm font-medium text-zinc-700 mb-1";
const fieldsetClass = "space-y-4 rounded-lg border border-zinc-200 p-4";
const legendClass = "px-1 text-sm font-semibold text-zinc-900";

function PartyFields({
  title,
  value,
  onChange,
}: {
  title: string;
  value: PartyInfo;
  onChange: (party: PartyInfo) => void;
}) {
  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>{title}</legend>
      <div>
        <label className={labelClass}>Company</label>
        <input
          className={inputClass}
          value={value.company}
          onChange={(e) => onChange({ ...value, company: e.target.value })}
          placeholder="Acme, Inc."
        />
      </div>
      <div>
        <label className={labelClass}>Print name</label>
        <input
          className={inputClass}
          value={value.printName}
          onChange={(e) => onChange({ ...value, printName: e.target.value })}
          placeholder="Jane Doe"
        />
      </div>
      <div>
        <label className={labelClass}>Title</label>
        <input
          className={inputClass}
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          placeholder="General Counsel"
        />
      </div>
      <div>
        <label className={labelClass}>Notice address (email or postal)</label>
        <input
          className={inputClass}
          value={value.noticeAddress}
          onChange={(e) =>
            onChange({ ...value, noticeAddress: e.target.value })
          }
          placeholder="legal@acme.com"
        />
      </div>
    </fieldset>
  );
}

export default function NdaForm({ data, onChange }: Props) {
  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Purpose &amp; dates</legend>
        <div>
          <label className={labelClass}>Purpose</label>
          <textarea
            className={inputClass}
            rows={3}
            value={data.purpose}
            onChange={(e) => onChange({ ...data, purpose: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Effective date</label>
          <input
            type="date"
            className={inputClass}
            value={data.effectiveDate}
            onChange={(e) =>
              onChange({ ...data, effectiveDate: e.target.value })
            }
          />
        </div>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>MNDA term</legend>
        <div className="flex items-center gap-2">
          <input
            type="radio"
            id="mnda-term-expires"
            name="mndaTermType"
            checked={data.mndaTermType === "expires"}
            onChange={() => onChange({ ...data, mndaTermType: "expires" })}
          />
          <label htmlFor="mnda-term-expires" className="text-sm text-zinc-700">
            Expires
          </label>
          <input
            type="number"
            min={1}
            className={`${inputClass} w-20`}
            value={data.mndaTermYears}
            disabled={data.mndaTermType !== "expires"}
            onChange={(e) =>
              onChange({
                ...data,
                mndaTermYears: Math.max(1, Number(e.target.value) || 1),
              })
            }
          />
          <span className="text-sm text-zinc-700">year(s) from Effective Date</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="radio"
            id="mnda-term-perpetual"
            name="mndaTermType"
            checked={data.mndaTermType === "perpetual"}
            onChange={() => onChange({ ...data, mndaTermType: "perpetual" })}
          />
          <label htmlFor="mnda-term-perpetual" className="text-sm text-zinc-700">
            Continues until terminated in accordance with the terms of the MNDA
          </label>
        </div>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Term of confidentiality</legend>
        <div className="flex items-center gap-2">
          <input
            type="radio"
            id="confidentiality-term"
            name="confidentialityTermType"
            checked={data.confidentialityTermType === "term"}
            onChange={() =>
              onChange({ ...data, confidentialityTermType: "term" })
            }
          />
          <input
            type="number"
            min={1}
            className={`${inputClass} w-20`}
            value={data.confidentialityTermYears}
            disabled={data.confidentialityTermType !== "term"}
            onChange={(e) =>
              onChange({
                ...data,
                confidentialityTermYears: Math.max(
                  1,
                  Number(e.target.value) || 1
                ),
              })
            }
          />
          <label
            htmlFor="confidentiality-term"
            className="text-sm text-zinc-700"
          >
            year(s) from Effective Date (trade secrets protected until they
            no longer qualify)
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="radio"
            id="confidentiality-perpetual"
            name="confidentialityTermType"
            checked={data.confidentialityTermType === "perpetual"}
            onChange={() =>
              onChange({ ...data, confidentialityTermType: "perpetual" })
            }
          />
          <label
            htmlFor="confidentiality-perpetual"
            className="text-sm text-zinc-700"
          >
            In perpetuity
          </label>
        </div>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Governing law &amp; jurisdiction</legend>
        <div>
          <label className={labelClass}>Governing law (state)</label>
          <input
            className={inputClass}
            value={data.governingLaw}
            onChange={(e) =>
              onChange({ ...data, governingLaw: e.target.value })
            }
            placeholder="Delaware"
          />
        </div>
        <div>
          <label className={labelClass}>
            Jurisdiction (city or county and state)
          </label>
          <input
            className={inputClass}
            value={data.jurisdiction}
            onChange={(e) =>
              onChange({ ...data, jurisdiction: e.target.value })
            }
            placeholder="New Castle, DE"
          />
        </div>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Modifications (optional)</legend>
        <textarea
          className={inputClass}
          rows={2}
          value={data.modifications}
          onChange={(e) =>
            onChange({ ...data, modifications: e.target.value })
          }
          placeholder="List any modifications to the MNDA"
        />
      </fieldset>

      <PartyFields
        title="Party 1"
        value={data.party1}
        onChange={(party1) => onChange({ ...data, party1 })}
      />
      <PartyFields
        title="Party 2"
        value={data.party2}
        onChange={(party2) => onChange({ ...data, party2 })}
      />
    </form>
  );
}
