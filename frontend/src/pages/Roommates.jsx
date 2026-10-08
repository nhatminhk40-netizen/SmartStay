import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHero from "@/components/smartstay/PageHero";
import RoommateCard from "@/components/smartstay/RoommateCard";
import { Field, EmptyState, Select } from "@/components/smartstay/FormBits";

const campuses = ["ĐH Cần Thơ", "ĐH Y Dược", "ĐH Nam Cần Thơ", "ĐH FPT"];
const empty = {
    name: "",
    gender: "Nam",
    age: "",
    campus: "ĐH Cần Thơ",
    budget: "",
    habits: "",
    description: "",
    contact: "",
};

export default function Roommates() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(empty);

    const load = async () => {
        setLoading(true);
        try {
            const res = await base44.entities.Roommate.filter(
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
            await base44.entities.Roommate.create({
                ...form,
                age: form.age ? Number(form.age) : null,
                budget: form.budget ? Number(form.budget) : null,
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
                icon={UserPlus}
                title="Ghép bạn"
                subtitle="Tìm bạn ở ghép phù hợp — cùng campus, cùng thói quen, đúng túi tiền."
                actionLabel="Đăng tìm bạn"
                onAction={() => setShowForm((s) => !s)}
            />

            <section className="max-w-7xl mx-auto px-6 py-8">
                {showForm && (
                    <form
                        onSubmit={submit}
                        className="bg-card rounded-3xl border border-border/60 shadow-sm p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        <div className="md:col-span-2 flex items-center justify-between">
                            <h2 className="font-heading font-semibold text-foreground">Đăng tìm bạn ở ghép</h2>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                            >
                                Đóng ✕
                            </button>
                        </div>
                        <Field label="Tên hiển thị">
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                placeholder="Nguyễn Văn A"
                            />
                        </Field>
                        <Field label="Giới tính">
                            <Select
                                value={form.gender}
                                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                                options={["Nam", "Nữ", "Khác"]}
                            />
                        </Field>
                        <Field label="Tuổi">
                            <Input
                                type="number"
                                value={form.age}
                                onChange={(e) => setForm({ ...form, age: e.target.value })}
                                placeholder="20"
                            />
                        </Field>
                        <Field label="Campus">
                            <Select
                                value={form.campus}
                                onChange={(e) => setForm({ ...form, campus: e.target.value })}
                                options={campuses}
                            />
                        </Field>
                        <Field label="Ngân sách (tr/tháng)">
                            <Input
                                type="number"
                                step="0.1"
                                value={form.budget}
                                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                                placeholder="2.5"
                            />
                        </Field>
                        <Field label="Thói quen (ngăn cách bởi dấu phẩy)">
                            <Input
                                value={form.habits}
                                onChange={(e) => setForm({ ...form, habits: e.target.value })}
                                placeholder="vệ sinh, không hút thuốc, ngủ sớm"
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
                            <Field label="Mô tả bản thân">
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    placeholder="Mình là sinh viên năm 3, dễ tính..."
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                                    "Đăng tìm bạn"
                                )}
                            </Button>
                        </div>
                    </form>
                )}

                <h2 className="font-heading font-bold text-foreground text-xl mb-4">
                    {items.length} người đang tìm bạn
                </h2>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : items.length === 0 ? (
                    <EmptyState text="Chưa có ai đăng tìm bạn ở ghép — hãy là người đầu tiên!" />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((it) => (
                            <RoommateCard key={it.id} item={it} />
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}