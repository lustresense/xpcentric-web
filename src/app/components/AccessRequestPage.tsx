import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, Clock, Loader2, ShieldCheck, UserCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";

type AccessNavigatePage = "landing" | "login" | "register" | "dashboard";
type RequestedRole = "ksh" | "moderator_t1" | "moderator_t2";
type ScopeType = "kelurahan" | "kecamatan";

interface AccessRequestPageProps {
  user: any | null;
  authToken: string | null;
  onNavigate: (page: AccessNavigatePage) => void;
}

interface GeoKelurahan {
  id: number;
  name: string;
  kodepos?: string[];
}

interface GeoKecamatan {
  id: number;
  name: string;
  kelurahan: GeoKelurahan[];
}

interface AccessRequest {
  id: string;
  requestedRole: RequestedRole;
  requestedScopeType: ScopeType;
  requestedKelurahan?: string | null;
  requestedKecamatan?: string | null;
  positionOrTitle: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewNote?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

const roleLabels: Record<RequestedRole, string> = {
  ksh: "KSH",
  moderator_t1: "Moderator T1",
  moderator_t2: "Moderator T2",
};

const statusLabels: Record<AccessRequest["status"], string> = {
  pending: "Menunggu review",
  approved: "Disetujui",
  rejected: "Ditolak",
};

const roleDescriptions: Record<RequestedRole, string> = {
  ksh: "Untuk petugas KSH yang membantu kehadiran dan penyelesaian kegiatan di kelurahan.",
  moderator_t1: "Untuk petugas yang membuat draft kegiatan sesuai wilayah tugas.",
  moderator_t2: "Untuk lurah/camat yang mereview event dan laporan sesuai wilayah.",
};

const initialForm = {
  requestedRole: "ksh" as RequestedRole,
  requestedScopeType: "kelurahan" as ScopeType,
  kecamatanId: "",
  kelurahanId: "",
  positionOrTitle: "",
  reason: "",
};

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function statusBadgeClass(status: AccessRequest["status"]) {
  if (status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "rejected") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function statusIcon(status: AccessRequest["status"]) {
  if (status === "approved") {
    return <BadgeCheck className="h-4 w-4" />;
  }
  if (status === "rejected") {
    return <XCircle className="h-4 w-4" />;
  }
  return <Clock className="h-4 w-4" />;
}

export function AccessRequestPage({ user, authToken, onNavigate }: AccessRequestPageProps) {
  const [geoOptions, setGeoOptions] = useState<GeoKecamatan[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const roleCode = String(user?.roleCode || user?.role || "");
  const canRequest = Boolean(user && authToken && (roleCode === "user" || roleCode === "ksh"));

  const roleOptions = useMemo(() => {
    const base: RequestedRole[] = roleCode === "ksh"
      ? ["moderator_t1", "moderator_t2"]
      : ["ksh", "moderator_t1", "moderator_t2"];
    return base;
  }, [roleCode]);

  const selectedKecamatan = useMemo(
    () => geoOptions.find((item) => String(item.id) === form.kecamatanId),
    [form.kecamatanId, geoOptions],
  );

  const kelurahanOptions = selectedKecamatan?.kelurahan || [];

  useEffect(() => {
    const loadGeo = async () => {
      try {
        const data = await apiGet<{ kecamatan: GeoKecamatan[] }>("/geo/options", authToken);
        const list = Array.isArray(data?.kecamatan) ? data.kecamatan : [];
        setGeoOptions(list);
      } catch (error: any) {
        toast.error(error?.message || "Data wilayah tidak bisa dimuat.");
      }
    };
    loadGeo();
  }, [authToken]);

  useEffect(() => {
    if (!geoOptions.length || !user) {
      return;
    }
    if (form.kecamatanId || form.kelurahanId) {
      return;
    }
    const userKecamatan = String(user.kecamatan || "").trim().toLowerCase();
    const userKelurahan = String(user.kelurahan || "").trim().toLowerCase();
    const kecamatan = geoOptions.find((item) => item.name.toLowerCase() === userKecamatan)
      || geoOptions.find((item) => item.kelurahan.some((kel) => kel.name.toLowerCase() === userKelurahan));
    const kelurahan = kecamatan?.kelurahan.find((item) => item.name.toLowerCase() === userKelurahan);
    if (kecamatan) {
      setForm((prev) => ({
        ...prev,
        kecamatanId: String(kecamatan.id),
        kelurahanId: kelurahan ? String(kelurahan.id) : prev.kelurahanId,
      }));
    }
  }, [form.kecamatanId, form.kelurahanId, geoOptions, user]);

  const fetchRequests = async () => {
    if (!authToken || !user) {
      setRequests([]);
      return;
    }
    setLoading(true);
    try {
      const data = await apiGet<{ requests: AccessRequest[] }>("/access-requests/me", authToken);
      setRequests(Array.isArray(data?.requests) ? data.requests : []);
    } catch (error: any) {
      toast.error(error?.message || "Riwayat pengajuan tidak bisa dimuat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, user?.id]);

  useEffect(() => {
    if (form.requestedRole === "ksh" && form.requestedScopeType !== "kelurahan") {
      setForm((prev) => ({ ...prev, requestedScopeType: "kelurahan" }));
    }
  }, [form.requestedRole, form.requestedScopeType]);

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "requestedRole") {
        next.requestedScopeType = value === "ksh" ? "kelurahan" : prev.requestedScopeType;
      }
      if (key === "requestedScopeType" && value === "kecamatan") {
        next.kelurahanId = "";
      }
      if (key === "kecamatanId") {
        next.kelurahanId = "";
      }
      return next;
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canRequest || !authToken) {
      toast.error("Silakan login sebagai relawan terlebih dahulu.");
      return;
    }
    if (!form.kecamatanId) {
      toast.error("Pilih kecamatan wilayah tugas.");
      return;
    }
    if (form.requestedScopeType === "kelurahan" && !form.kelurahanId) {
      toast.error("Pilih kelurahan wilayah tugas.");
      return;
    }
    if (!form.positionOrTitle.trim()) {
      toast.error("Isi jabatan atau keterangan petugas.");
      return;
    }
    if (!form.reason.trim()) {
      toast.error("Isi alasan pengajuan akses.");
      return;
    }

    setSubmitting(true);
    try {
      await apiPost("/access-requests", {
        requestedRole: form.requestedRole,
        requestedScopeType: form.requestedScopeType,
        requestedKelurahanId: form.requestedScopeType === "kelurahan" ? Number(form.kelurahanId) : null,
        requestedKecamatanId: Number(form.kecamatanId),
        positionOrTitle: form.positionOrTitle,
        reason: form.reason,
      }, authToken);
      toast.success("Pengajuan akses petugas berhasil dikirim.");
      setForm((prev) => ({ ...prev, positionOrTitle: "", reason: "" }));
      await fetchRequests();
    } catch (error: any) {
      toast.error(error?.message || "Pengajuan akses gagal dikirim.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f8f5] px-4 py-6 text-[#17221c] lg:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => onNavigate(user ? "dashboard" : "landing")}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d8e4dc] bg-white px-3 py-2 text-sm font-semibold text-[#244338] shadow-sm hover:border-[#0f6b45]/40 hover:text-[#0f6b45]"
        >
          <ArrowLeft className="h-4 w-4" />
          {user ? "Kembali ke Dashboard" : "Kembali ke Beranda"}
        </button>

        <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <Card className="rounded-2xl border-[#d8e4dc] bg-white shadow-sm">
            <CardHeader className="pb-4">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#0f6b45] text-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">Portal Akses Petugas</CardTitle>
              <CardDescription className="text-base leading-relaxed text-[#63756c]">
                Daftar publik tetap relawan. Akses KSH dan moderator aktif setelah admin meninjau pengajuan berdasarkan email dan wilayah tugas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[#4f6158]">
              <div className="rounded-xl border border-[#dbe7df] bg-[#f8fbf9] p-4">
                <p className="font-semibold text-[#17221c]">Alur demo</p>
                <ol className="mt-2 space-y-1">
                  <li>1. Relawan login atau daftar akun biasa.</li>
                  <li>2. Relawan mengajukan akses petugas di halaman ini.</li>
                  <li>3. Admin mereview dari dashboard admin.</li>
                  <li>4. Role baru aktif setelah approval admin.</li>
                </ol>
              </div>
              <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                <AlertDescription>
                  Pengajuan ini tidak mengubah role secara langsung. Admin tetap menjadi pintu approval.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-[#d8e4dc] bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Ajukan akses baru</CardTitle>
              <CardDescription>Pilih role dan wilayah sesuai tugas yang akan didemokan.</CardDescription>
            </CardHeader>
            <CardContent>
              {!user || !authToken ? (
                <div className="rounded-xl border border-[#dbe7df] bg-[#f8fbf9] p-5">
                  <p className="font-semibold text-[#17221c]">Login relawan diperlukan</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#63756c]">
                    Buat akun relawan atau login dulu. Setelah itu kembali ke halaman ini untuk mengajukan akses KSH/moderator.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button type="button" onClick={() => onNavigate("login")} className="bg-[#0f6b45] text-white hover:bg-[#0b5738]">
                      Masuk
                    </Button>
                    <Button type="button" variant="outline" onClick={() => onNavigate("register")}>
                      Daftar Relawan
                    </Button>
                  </div>
                </div>
              ) : !canRequest ? (
                <div className="rounded-xl border border-[#dbe7df] bg-[#f8fbf9] p-5">
                  <p className="font-semibold text-[#17221c]">Akun ini tidak perlu pengajuan petugas</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#63756c]">
                    Role akun kamu sudah berada di level admin/moderator. Gunakan dashboard sesuai role yang aktif.
                  </p>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Role yang diajukan</Label>
                      <Select value={form.requestedRole} onValueChange={(value) => updateForm("requestedRole", value)}>
                        <SelectTrigger className="h-11 rounded-xl border-[#d8e4dc]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role} value={role}>{roleLabels[role]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs leading-relaxed text-[#66776e]">{roleDescriptions[form.requestedRole]}</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Scope wilayah</Label>
                      <Select
                        value={form.requestedScopeType}
                        disabled={form.requestedRole === "ksh"}
                        onValueChange={(value) => updateForm("requestedScopeType", value)}
                      >
                        <SelectTrigger className="h-11 rounded-xl border-[#d8e4dc]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kelurahan">Kelurahan</SelectItem>
                          <SelectItem value="kecamatan">Kecamatan</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs leading-relaxed text-[#66776e]">
                        KSH wajib kelurahan. Moderator mengikuti scope wilayah existing.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Kecamatan</Label>
                      <Select value={form.kecamatanId} onValueChange={(value) => updateForm("kecamatanId", value)}>
                        <SelectTrigger className="h-11 rounded-xl border-[#d8e4dc]">
                          <SelectValue placeholder="Pilih kecamatan" />
                        </SelectTrigger>
                        <SelectContent>
                          {geoOptions.map((item) => (
                            <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Kelurahan</Label>
                      <Select
                        value={form.kelurahanId}
                        disabled={form.requestedScopeType === "kecamatan" || !form.kecamatanId}
                        onValueChange={(value) => updateForm("kelurahanId", value)}
                      >
                        <SelectTrigger className="h-11 rounded-xl border-[#d8e4dc]">
                          <SelectValue placeholder={form.requestedScopeType === "kecamatan" ? "Tidak wajib untuk camat" : "Pilih kelurahan"} />
                        </SelectTrigger>
                        <SelectContent>
                          {kelurahanOptions.map((item) => (
                            <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="positionOrTitle">Jabatan atau keterangan</Label>
                    <Input
                      id="positionOrTitle"
                      value={form.positionOrTitle}
                      onChange={(event) => updateForm("positionOrTitle", event.target.value)}
                      placeholder="Contoh: KSH RW 04, ASN kelurahan, staf kecamatan"
                      className="h-11 rounded-xl border-[#d8e4dc]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Alasan pengajuan</Label>
                    <Textarea
                      id="reason"
                      value={form.reason}
                      onChange={(event) => updateForm("reason", event.target.value)}
                      placeholder="Jelaskan kebutuhan akses untuk skenario demo atau tugas wilayah."
                      className="min-h-28 rounded-xl border-[#d8e4dc]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-11 w-full rounded-xl bg-[#0f6b45] text-white hover:bg-[#0b5738]"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                    Kirim Pengajuan
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </section>

        {user && authToken && (
          <Card className="mt-5 rounded-2xl border-[#d8e4dc] bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Riwayat pengajuan saya</CardTitle>
              <CardDescription>Status terbaru dari pengajuan akses petugas.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2 rounded-xl border border-[#dbe7df] bg-[#f8fbf9] p-4 text-sm text-[#63756c]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat riwayat pengajuan...
                </div>
              ) : requests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#d0ded5] bg-[#f8fbf9] p-5 text-sm text-[#63756c]">
                  Belum ada pengajuan. Kirim pengajuan pertama untuk skenario akses petugas.
                </div>
              ) : (
                <div className="grid gap-3">
                  {requests.map((request) => (
                    <article key={request.id} className="rounded-xl border border-[#dbe7df] p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-[#17221c]">{roleLabels[request.requestedRole]}</p>
                            <Badge variant="outline" className={statusBadgeClass(request.status)}>
                              {statusIcon(request.status)}
                              {statusLabels[request.status]}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-[#63756c]">
                            {request.requestedScopeType === "kelurahan"
                              ? `${request.requestedKelurahan || "Kelurahan"} - ${request.requestedKecamatan || "Kecamatan"}`
                              : request.requestedKecamatan || "Kecamatan"}
                          </p>
                          <p className="mt-2 text-sm text-[#46584f]">{request.positionOrTitle}</p>
                          {request.reviewNote && (
                            <p className="mt-2 rounded-lg bg-[#f8fbf9] px-3 py-2 text-xs text-[#63756c]">
                              Catatan admin: {request.reviewNote}
                            </p>
                          )}
                        </div>
                        <div className="text-left text-xs text-[#7a8a82] md:text-right">
                          <p>Diajukan {formatDate(request.createdAt)}</p>
                          {request.reviewedAt && <p>Direview {formatDate(request.reviewedAt)}</p>}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
