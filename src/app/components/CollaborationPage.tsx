import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Handshake, Home, Sparkles } from "lucide-react";
import { apiPublicGet, apiPublicPost } from "@/lib/api";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { toast } from "sonner";

interface CollaborationPageProps {
  onNavigate: (page: "landing" | "login") => void;
}

interface CollaborationForm {
  organizationName: string;
  picName: string;
  email: string;
  supportType: "dana" | "konsumsi" | "peralatan" | "media_partner" | "lainnya";
  contributionScope: "kota" | "kecamatan" | "kelurahan";
  kecamatanId: string;
  kelurahanId: string;
  supportDescription: string;
}

interface GeoKelurahan {
  id: number;
  name: string;
  kodepos: string[];
}

interface GeoKecamatan {
  id: number;
  name: string;
  kelurahan: GeoKelurahan[];
}

const supportOptions: Array<{ value: CollaborationForm["supportType"]; label: string }> = [
  { value: "dana", label: "Sponsorship & Pendanaan" },
  { value: "konsumsi", label: "Konsumsi" },
  { value: "peralatan", label: "Peralatan" },
  { value: "media_partner", label: "Media Partner" },
  { value: "lainnya", label: "Lainnya" },
];

const initialForm: CollaborationForm = {
  organizationName: "",
  picName: "",
  email: "",
  supportType: "dana",
  contributionScope: "kota",
  kecamatanId: "",
  kelurahanId: "",
  supportDescription: "",
};

export function CollaborationPage({ onNavigate }: CollaborationPageProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CollaborationForm>(initialForm);
  const [geoOptions, setGeoOptions] = useState<GeoKecamatan[]>([]);
  const [receipt, setReceipt] = useState<{ requestId: string; submittedAt: string } | null>(null);

  const formattedDate = useMemo(() => {
    const source = receipt?.submittedAt ? new Date(receipt.submittedAt) : new Date();
    return source.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  }, [receipt?.submittedAt]);

  const updateField = <K extends keyof CollaborationForm>(key: K, value: CollaborationForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const loadGeo = async () => {
      try {
        const data = await apiPublicGet<{ kecamatan: GeoKecamatan[] }>("/geo/options");
        setGeoOptions(Array.isArray(data?.kecamatan) ? data.kecamatan : []);
      } catch {
        // Optional data, form tetap bisa dipakai untuk skala kota.
      }
    };
    loadGeo();
  }, []);

  useEffect(() => {
    if (form.contributionScope === "kota") {
      setForm((prev) => ({ ...prev, kecamatanId: "", kelurahanId: "" }));
      return;
    }
    if (form.contributionScope === "kecamatan") {
      setForm((prev) => ({ ...prev, kelurahanId: "" }));
    }
  }, [form.contributionScope]);

  const selectedKecamatan = useMemo(
    () => geoOptions.find((item) => String(item.id) === form.kecamatanId),
    [geoOptions, form.kecamatanId],
  );
  const kelurahanOptions = selectedKecamatan?.kelurahan || [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.contributionScope !== "kota" && !form.kecamatanId) {
      toast.error("Pilih kecamatan untuk skala kontribusi ini.");
      return;
    }
    if (form.contributionScope === "kelurahan" && !form.kelurahanId) {
      toast.error("Pilih kelurahan untuk skala kelurahan.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        organizationName: form.organizationName,
        picName: form.picName,
        email: form.email,
        supportType: form.supportType,
        contributionScope: form.contributionScope,
        kecamatanId: form.kecamatanId ? Number(form.kecamatanId) : null,
        kelurahanId: form.kelurahanId ? Number(form.kelurahanId) : null,
        supportDescription: form.supportDescription,
      };
      const data = await apiPublicPost<any>("/collaboration-requests", payload);
      if (!data?.success) {
        throw new Error("Pengajuan kolaborasi gagal diproses");
      }
      const requestId = data?.request?.id || `REQ-${Date.now().toString().slice(-8)}`;
      setReceipt({ requestId, submittedAt: new Date().toISOString() });
      toast.success("Pengajuan kolaborasi berhasil dikirim");
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat mengirim pengajuan");
    } finally {
      setSubmitting(false);
    }
  };

  if (receipt) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#f8faf9] px-4 py-8 text-slate-800">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(21,87,56,0.08),transparent_42%),radial-gradient(circle_at_85%_85%,rgba(255,199,0,0.16),transparent_46%)]" />
        <main className="relative z-10 mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
          <Card className="w-full overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_24px_48px_rgba(0,0,0,0.09)]">
            <CardContent className="p-8 text-center">
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-emerald-50">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
              </div>
              <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">Pengajuan Berhasil</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Terima kasih. Tim kami akan meninjau pengajuan kolaborasi Anda dan menghubungi PIC melalui email.
              </p>

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs text-slate-500">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-600">ID Request</span>
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-slate-700">{receipt.requestId}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-600">Tanggal</span>
                  <span>{formattedDate}</span>
                </div>
              </div>

              <div className="mt-6 grid gap-2">
                <Button
                  type="button"
                  onClick={() => onNavigate("landing")}
                  className="h-11 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Kembali ke Beranda
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setReceipt(null);
                    setForm(initialForm);
                  }}
                  className="h-11 rounded-xl border-[#d7e1db]"
                >
                  Buat Pengajuan Baru
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8faf9] px-4 py-6 text-slate-800 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(21,87,56,0.1),transparent_42%),radial-gradient(circle_at_88%_82%,rgba(255,199,0,0.18),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(#155738_0.6px,transparent_0.6px)] [background-size:24px_24px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => onNavigate("landing")}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-[#155738]/30 hover:text-[#155738]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </button>

        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-14">
          <section className="lg:col-span-5">
            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_22px_44px_rgba(0,0,0,0.08)]">
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80"
                  alt="Kolaborasi warga Surabaya"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f3f2a]/45 to-transparent" />
                <div className="absolute bottom-4 left-4 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-[#155738]">
                  Surabaya Sinergi
                </div>
              </div>
              <div className="p-6">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                  Kolaborasi <span className="text-[#155738]">SIMREKAP</span>
                </h1>
                <p className="mt-3 text-base leading-relaxed text-slate-600">
                  Platform kolaborasi resmi untuk mendukung kegiatan kampung melalui dukungan lintas sektor.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                  <Handshake className="h-3.5 w-3.5 text-[#155738]" />
                  Bergabung dengan ratusan mitra kolaborasi
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-7">
            <Card className="rounded-[2rem] border border-slate-100 bg-white/95 shadow-[0_24px_48px_rgba(0,0,0,0.08)] backdrop-blur">
              <CardHeader className="space-y-2 pb-3">
                <CardTitle className="text-2xl font-bold text-slate-900">Ajukan Kolaborasi</CardTitle>
                <p className="text-sm text-slate-500">
                  Pengajuan akan tercatat sebagai <strong>collaboration_request</strong> dan diproses Moderator Tier 2.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={submit} className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="org_name" className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Nama Organisasi
                      </Label>
                      <Input
                        id="org_name"
                        value={form.organizationName}
                        onChange={(e) => updateField("organizationName", e.target.value)}
                        placeholder="Contoh: Komunitas Surabaya Hebat"
                        className="h-11 rounded-xl border-slate-200 bg-slate-50"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pic_name" className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Nama PIC
                      </Label>
                      <Input
                        id="pic_name"
                        value={form.picName}
                        onChange={(e) => updateField("picName", e.target.value)}
                        placeholder="Nama penanggung jawab"
                        className="h-11 rounded-xl border-slate-200 bg-slate-50"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Email Kerja
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="nama@organisasi.id"
                      className="h-11 rounded-xl border-slate-200 bg-slate-50"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="support_type" className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Kategori Dukungan
                    </Label>
                    <select
                      id="support_type"
                      value={form.supportType}
                      onChange={(e) => updateField("supportType", e.target.value as CollaborationForm["supportType"])}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800"
                      required
                    >
                      {supportOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contribution_scope" className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Skala Kontribusi
                    </Label>
                    <select
                      id="contribution_scope"
                      value={form.contributionScope}
                      onChange={(e) => updateField("contributionScope", e.target.value as CollaborationForm["contributionScope"])}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800"
                    >
                      <option value="kota">Kota</option>
                      <option value="kecamatan">Kecamatan</option>
                      <option value="kelurahan">Kelurahan (Kampung)</option>
                    </select>
                  </div>

                  {form.contributionScope !== "kota" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="kecamatan_id" className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Kecamatan
                      </Label>
                      <select
                        id="kecamatan_id"
                        value={form.kecamatanId}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, kecamatanId: e.target.value, kelurahanId: "" }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800"
                        required
                      >
                        <option value="">Pilih kecamatan</option>
                        {geoOptions.map((kecamatan) => (
                          <option key={kecamatan.id} value={kecamatan.id}>
                            {kecamatan.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {form.contributionScope === "kelurahan" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="kelurahan_id" className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Kelurahan (Kampung)
                      </Label>
                      <select
                        id="kelurahan_id"
                        value={form.kelurahanId}
                        onChange={(e) => updateField("kelurahanId", e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800"
                        required
                        disabled={!form.kecamatanId}
                      >
                        <option value="">Pilih kelurahan</option>
                        {kelurahanOptions.map((kelurahan) => (
                          <option key={kelurahan.id} value={kelurahan.id}>
                            {kelurahan.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="support_description" className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Gambaran Dukungan
                    </Label>
                    <Textarea
                      id="support_description"
                      value={form.supportDescription}
                      onChange={(e) => updateField("supportDescription", e.target.value)}
                      placeholder="Jelaskan kontribusi yang ingin Anda berikan"
                      rows={5}
                      className="rounded-xl border-slate-200 bg-slate-50"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-12 w-full rounded-xl bg-[#155738] text-white hover:bg-[#0f4a2f]"
                  >
                    {submitting ? "Mengirim..." : "Kirim Proposal"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <p className="flex items-center justify-center gap-1 text-center text-xs text-slate-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    Data diproses sesuai kebijakan privasi Pemerintah Kota Surabaya.
                  </p>
                </form>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
