import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Truck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHero from "@/components/smartstay/PageHero";
import TransferCard from "@/components/smartstay/TransferCard";
import { Field, EmptyState } from "@/components/smartstay/FormBits";

const empty = {
    title: "",
    location: "",
    price: "",
    deposit: "",
    reason: "",
    contact: "",
    image: "",
};

export default function Transfers() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(empty);

    const load = async () => {
        setLoading(true);
        try {
            const res = await base44.entities.Transfer.filter(
                {},
                { sort: "-created_date", limit: 50 }
            );
            setItems(res.items || []);
        } catch {
            setItems([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await base44.entities.Transfer.create({
                ...form,
                price: Number(form.price) || null,
                deposit: form.deposit ? Number(form.deposit) : null,
            });
            setForm(empty);
            setShowForm(false);
            load();
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <PageHero
                icon={Truck}
                title="Chuyển trọ"
                subtitle="Sang nhượng phòng niêm yết — cọc bảo lãnh an toàn, giá rõ ràng cho sinh viên."
                actionLabel="Đăng chuyển trọ"
                onAction={() => setShowForm((s) => !s)}
            />

            <section className="max-w-7xl mx-auto px-6 py-8">
                {showForm && (
                    <form
                        onSubmit={submit}
                        className="bg-card rounded-3xl border border-border/60 shadow-sm p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        <div className="md:col-span-2 flex items-center justify-between">
                            <h2 className="font-heading font-semibold text-foreground">Đăng sang nhượng phòng</h2>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                            >
                                Đóng ✕
                            </button>
                        </div>
                        <Field label="Tiêu đề phòng">
                            <Input
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                required
                                placeholder="Phòng trọ gần ĐH Cần Thơ"
                            />
                        </Field>
                        <Field label="Khu vực">
                            <Input
                                value={form.location}
                                onChange={(e) => setForm({ ...form, location: e.target.value })}
                                required
                                placeholder="Ninh Kiều"
                            />
                        </Field>
                        <Field label="Giá thuê (tr/tháng)">
                            <Input
                                type="number"
                                step="0.1"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                required
                                placeholder="3.5"
                            />
                        </Field>
                        <Field label="Tiền cọc (tr)">
                            <Input
                                type="number"
                                step="0.1"
                                value={form.deposit}
                                onChange={(e) => setForm({ ...form, deposit: e.target.value })}
                                placeholder="3"
                            />
                        </Field>
                        <Field label="Lý do chuyển">
                            <Input
                                value={form.reason}
                                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                placeholder="Ra trường về quê"
                            />
                        </Field>
                        <Field label="Liên hệ">
                            <Input
                                value={form.contact}
                                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                                placeholder="Zalo / SĐT"
                            />
                        </Field>
                        <div className="md:col-span-2">
                            <Field label="Ảnh phòng (URL)">
                                <Input
                                    value={form.image}
                                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                                    placeholder="https://..."
                                />
                            </Field>
                        </div>
                        <div className="md:col-span-2">
                            <Button
                                type="submit"
                                disabled={saving}
                                className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang đăng...
                                    </>
                                ) : (
                                    "Đăng chuyển trọ"
                                )}
                            </Button>
                        </div>
                    </form>
                )}

                <h2 className="font-heading font-bold text-foreground text-xl mb-4">
                    {items.length} phòng sang nhượng
                </h2>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : items.length === 0 ? (
                    <EmptyState text="Chưa có phòng nào sang nhượng." />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {items.map((it) => (
                            <TransferCard key={it.id} item={it} />
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}