const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Contract = require('../models/Contract');
const Room = require('../models/Room');
const { protect, authorize } = require('../middleware/auth');

// Helper chuẩn hóa so sánh ID
const isSameId = (a, b) => {
    if (!a || !b) return false;
    return String(a) === String(b);
};

// Local in-memory mock store cho Bảng chốt số điện nước Grid (khi không có DB Atlas)
const fallbackGridStore = {
    // Tháng 9/2026: Dữ liệu chốt tháng trước làm căn cứ nhảy số tự động
    "2026_9": [
        {
            id: "row_demo_101",
            contractId: "ctr_sample_001",
            roomId: "6aad186f1f34d48876cf6301",
            roomNumber: "P.101",
            propertyName: "Khu trọ Cô Ba (Hẻm 51)",
            tenantName: "Nguyễn Văn A",
            tenantPhone: "0912 345 678",
            monthlyRent: 2500000,
            electricPrice: 3500,
            electricPrevious: 1120,
            electricCurrent: 1205,
            electricUsage: 85,
            electricTotal: 297500,
            waterPrice: 15000,
            waterPrevious: 82,
            waterCurrent: 86,
            waterUsage: 4,
            waterTotal: 60000,
            otherFees: [{ name: "Wifi", amount: 50000 }, { name: "Rác", amount: 20000 }],
            otherTotal: 70000,
            previousDebt: 0,
            totalAmount: 2927500,
            status: "paid",
            billId: "bill_demo_9_101",
            isAutoRollover: false,
            hasPrevRecord: true,
            note: "Đã thanh toán đủ ngày 5/9"
        },
        {
            id: "row_demo_102",
            contractId: "ctr_sample_002",
            roomId: "room_1792910996318",
            roomNumber: "P.102",
            propertyName: "Khu trọ Cô Ba (Hẻm 51)",
            tenantName: "Lê Thị Hoa",
            tenantPhone: "0938 888 999",
            monthlyRent: 2200000,
            electricPrice: 3500,
            electricPrevious: 410,
            electricCurrent: 490,
            electricUsage: 80,
            electricTotal: 280000,
            waterPrice: 15000,
            waterPrevious: 25,
            waterCurrent: 30,
            waterUsage: 5,
            waterTotal: 75000,
            otherFees: [{ name: "Wifi", amount: 50000 }, { name: "Rác", amount: 20000 }],
            otherTotal: 70000,
            previousDebt: 0,
            totalAmount: 2625000,
            status: "paid",
            billId: "bill_demo_9_102",
            isAutoRollover: false,
            hasPrevRecord: true,
            note: ""
        },
        {
            id: "row_demo_103",
            contractId: "ctr_sample_003",
            roomId: "room_1792909860402",
            roomNumber: "P.103",
            propertyName: "Khu trọ Cô Ba (Hẻm 51)",
            tenantName: "Trần Minh Quân",
            tenantPhone: "0909 112 233",
            monthlyRent: 2400000,
            electricPrice: 3500,
            electricPrevious: 750,
            electricCurrent: 835,
            electricUsage: 85,
            electricTotal: 297500,
            waterPrice: 15000,
            waterPrevious: 48,
            waterCurrent: 53,
            waterUsage: 5,
            waterTotal: 75000,
            otherFees: [{ name: "Wifi", amount: 50000 }, { name: "Rác", amount: 20000 }],
            otherTotal: 70000,
            previousDebt: 150000,
            totalAmount: 2992500,
            status: "unpaid",
            billId: "bill_demo_9_103",
            isAutoRollover: false,
            hasPrevRecord: true,
            note: "Còn thiếu 150k phụ phí tháng trước"
        },
        {
            id: "row_demo_104",
            contractId: "ctr_sample_004",
            roomId: "room_demo_104",
            roomNumber: "P.104",
            propertyName: "Khu trọ Cô Ba (Hẻm 51)",
            tenantName: "Phạm Thùy Linh",
            tenantPhone: "0944 556 778",
            monthlyRent: 2000000,
            electricPrice: 3500,
            electricPrevious: 320,
            electricCurrent: 395,
            electricUsage: 75,
            electricTotal: 262500,
            waterPrice: 15000,
            waterPrevious: 18,
            waterCurrent: 22,
            waterUsage: 4,
            waterTotal: 60000,
            otherFees: [{ name: "Wifi", amount: 50000 }, { name: "Rác", amount: 20000 }],
            otherTotal: 70000,
            previousDebt: 0,
            totalAmount: 2392500,
            status: "paid",
            billId: "bill_demo_9_104",
            isAutoRollover: false,
            hasPrevRecord: true,
            note: ""
        },
        {
            id: "row_demo_105",
            contractId: null,
            roomId: "room_demo_105",
            roomNumber: "P.105",
            propertyName: "Khu trọ Cô Ba (Hẻm 51)",
            tenantName: "Phòng Trống (Sắp dọn vào)",
            tenantPhone: "",
            monthlyRent: 2200000,
            electricPrice: 3500,
            electricPrevious: 150,
            electricCurrent: 150,
            electricUsage: 0,
            electricTotal: 0,
            waterPrice: 15000,
            waterPrevious: 12,
            waterCurrent: 12,
            waterUsage: 0,
            waterTotal: 0,
            otherFees: [],
            otherTotal: 0,
            previousDebt: 0,
            totalAmount: 0,
            status: "draft",
            billId: null,
            isAutoRollover: false,
            hasPrevRecord: false,
            note: "Phòng đang trống"
        }
    ]
};

// Hàm lấy dữ liệu bảng lưới khi ở chế độ Fallback
const getFallbackGridRows = (month, year, prevMonth, prevYear) => {
    const key = `${year}_${month}`;
    if (fallbackGridStore[key] && fallbackGridStore[key].length > 0) {
        return fallbackGridStore[key];
    }

    // Cơ chế nhảy số tự động từ tháng trước
    const prevKey = `${prevYear}_${prevMonth}`;
    const prevRows = fallbackGridStore[prevKey] || fallbackGridStore["2026_9"] || [];

    const newRows = prevRows.map(prev => {
        const elecPrev = prev.electricCurrent !== '' && prev.electricCurrent !== null ? Number(prev.electricCurrent) : Number(prev.electricPrevious);
        const waterPrev = prev.waterCurrent !== '' && prev.waterCurrent !== null ? Number(prev.waterCurrent) : Number(prev.waterPrevious);
        const debt = prev.status === 'unpaid' ? (Number(prev.totalAmount) || 0) : 0;
        const otherTotal = (prev.otherFees || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const rent = Number(prev.monthlyRent) || 0;

        return {
            id: `row_${key}_${prev.roomNumber}`,
            contractId: prev.contractId,
            roomId: prev.roomId,
            roomNumber: prev.roomNumber,
            propertyName: prev.propertyName,
            tenantName: prev.tenantName,
            tenantPhone: prev.tenantPhone,
            monthlyRent: rent,
            electricPrice: prev.electricPrice || 3500,
            electricPrevious: elecPrev,
            electricCurrent: "", // Mới mở tháng -> Để trống sẵn sàng cho chủ trọ đi đọc công tơ
            electricUsage: 0,
            electricTotal: 0,
            waterPrice: prev.waterPrice || 15000,
            waterPrevious: waterPrev,
            waterCurrent: "", // Để trống
            waterUsage: 0,
            waterTotal: 0,
            otherFees: prev.otherFees || [{ name: "Wifi", amount: 50000 }, { name: "Rác", amount: 20000 }],
            otherTotal,
            previousDebt: debt,
            totalAmount: rent + otherTotal + debt,
            status: "draft", // Chưa chốt số
            billId: null,
            isAutoRollover: true, // Đã tự động kế thừa từ số mới tháng trước
            hasPrevRecord: true,
            note: debt > 0 ? `Chuyển nợ cũ ${debt.toLocaleString('vi-VN')}đ từ Tháng ${prevMonth}` : ""
        };
    });

    fallbackGridStore[key] = newRows;
    return newRows;
};

// Hàm lưu dữ liệu bảng lưới khi ở chế độ Fallback
const saveFallbackGridRows = (month, year, rows) => {
    const key = `${year}_${month}`;
    fallbackGridStore[key] = rows.map(r => {
        const elPrev = Number(r.electricPrevious) || 0;
        const elCurr = r.electricCurrent !== "" && r.electricCurrent !== null ? Number(r.electricCurrent) : elPrev;
        const elUsage = Math.max(0, elCurr - elPrev);
        const elTotal = elUsage * (Number(r.electricPrice) || 3500);

        const waPrev = Number(r.waterPrevious) || 0;
        const waCurr = r.waterCurrent !== "" && r.waterCurrent !== null ? Number(r.waterCurrent) : waPrev;
        const waUsage = Math.max(0, waCurr - waPrev);
        const waTotal = waUsage * (Number(r.waterPrice) || 15000);

        const otherTotal = (r.otherFees || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const rent = Number(r.monthlyRent) || 0;
        const debt = Number(r.previousDebt) || 0;
        const total = rent + elTotal + waTotal + otherTotal + debt;

        return {
            ...r,
            electricPrevious: elPrev,
            electricCurrent: elCurr,
            electricUsage: elUsage,
            electricTotal: elTotal,
            waterPrevious: waPrev,
            waterCurrent: waCurr,
            waterUsage: waUsage,
            waterTotal: waTotal,
            otherTotal,
            totalAmount: total,
            status: r.status || (r.electricCurrent !== "" ? "unpaid" : "draft"),
            billId: r.billId || `bill_mock_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            isAutoRollover: false
        };
    });
};

// ============================================================================
// 0. BẢNG CHỐT SỐ ĐIỆN NƯỚC DẠNG LƯỚI (SMART METER GRID) CHO CHỦ TRỌ
// ============================================================================

// 0.1 Lấy dữ liệu bảng lưới chốt số theo Tháng và Năm
router.get('/grid', protect, authorize('landlord', 'admin', 'employee'), async (req, res) => {
    try {
        const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const currentUserId = req.user._id || req.user.id;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';
        const isDbConnected = req.app.locals.isDbConnected;

        // Tính tháng trước (tự động xử lý lùi năm khi là Tháng 1)
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;

        if (isDbConnected) {
            // Lấy hợp đồng của chủ trọ
            const contractQuery = isAdmin ? {} : { landlord: currentUserId };
            const contracts = await Contract.find(contractQuery)
                .populate('room')
                .populate('tenant', 'fullName phone email')
                .sort({ createdAt: -1 });

            // Lấy danh sách phòng thuộc sở hữu của chủ trọ
            const roomQuery = isAdmin ? {} : { owner: currentUserId };
            const ownedRooms = await Room.find(roomQuery);

            // Lấy toàn bộ hóa đơn để đối soát
            const billQuery = isAdmin ? {} : { landlord: currentUserId };
            const allBills = await Bill.find(billQuery)
                .populate('room', 'title room_number property_name')
                .populate('tenant', 'fullName phone');

            const currentBills = allBills.filter(b => b.month === month && b.year === year);
            const prevBills = allBills.filter(b => b.month === prevMonth && b.year === prevYear);

            const rows = [];
            const seenRoomIds = new Set();

            // 1. Duyệt qua hợp đồng
            for (const c of contracts) {
                if (!c.room) continue;
                const roomId = String(c.room._id || c.room);
                seenRoomIds.add(roomId);

                const currentBill = currentBills.find(b => 
                    String(b.contract?._id || b.contract) === String(c._id) || 
                    String(b.room?._id || b.room) === roomId
                );
                const prevBill = prevBills.find(b => 
                    String(b.contract?._id || b.contract) === String(c._id) || 
                    String(b.room?._id || b.room) === roomId
                );

                // Nợ cũ lũy kế từ các hóa đơn chưa trả của tháng trước
                const unpaidPastBills = allBills.filter(b => 
                    (String(b.contract?._id || b.contract) === String(c._id) || String(b.room?._id || b.room) === roomId) &&
                    (b.year < year || (b.year === year && b.month < month)) &&
                    b.status === 'unpaid'
                );
                const accumulatedDebt = unpaidPastBills.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

                const elecRate = Number(c.electricPrice) || 3500;
                const waterRate = Number(c.waterPrice) || 20000;
                const roomRent = Number(c.monthlyRent) || Number(c.room?.price) || 0;

                // Cơ chế tự động nhảy số cũ: Lấy số mới của tháng trước nếu chưa lập hóa đơn tháng này
                const elecPrev = currentBill ? currentBill.electric.previousNumber : (prevBill ? prevBill.electric.currentNumber : 0);
                const elecCurr = currentBill ? (currentBill.electric.currentNumber !== undefined ? currentBill.electric.currentNumber : '') : '';
                const elecUsage = elecCurr !== '' ? Math.max(0, Number(elecCurr) - Number(elecPrev)) : 0;
                const elecTotal = elecUsage * elecRate;

                const waterPrev = currentBill ? currentBill.water.previousNumber : (prevBill ? prevBill.water.currentNumber : 0);
                const waterCurr = currentBill ? (currentBill.water.currentNumber !== undefined ? currentBill.water.currentNumber : '') : '';
                const waterUsage = waterCurr !== '' ? Math.max(0, Number(waterCurr) - Number(waterPrev)) : 0;
                const waterTotal = waterUsage * waterRate;

                const defaultOtherFees = [];
                if (c.room?.extraFees?.wifi) defaultOtherFees.push({ name: 'Wifi', amount: c.room.extraFees.wifi });
                if (c.room?.extraFees?.trash) defaultOtherFees.push({ name: 'Rác', amount: c.room.extraFees.trash });

                const otherFees = (currentBill?.otherFees && currentBill.otherFees.length > 0) ? currentBill.otherFees : defaultOtherFees;
                const otherTotal = otherFees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
                const debt = currentBill ? (currentBill.previousDebt || 0) : accumulatedDebt;

                const totalAmount = currentBill ? currentBill.totalAmount : (roomRent + elecTotal + waterTotal + otherTotal + debt);
                const status = currentBill ? currentBill.status : (elecCurr !== '' ? 'unpaid' : 'draft');

                rows.push({
                    id: `row_c_${c._id}`,
                    contractId: c._id,
                    roomId: c.room._id,
                    roomNumber: c.room.room_number || c.room.title || 'Phòng thuê',
                    propertyName: c.room.property_name || 'Khu trọ SmartStay',
                    tenantName: c.tenant?.fullName || 'Khách thuê',
                    tenantPhone: c.tenant?.phone || '',
                    monthlyRent: roomRent,
                    electricPrice: elecRate,
                    electricPrevious: elecPrev,
                    electricCurrent: elecCurr,
                    electricUsage,
                    electricTotal,
                    waterPrice: waterRate,
                    waterPrevious: waterPrev,
                    waterCurrent: waterCurr,
                    waterUsage,
                    waterTotal,
                    otherFees,
                    otherTotal,
                    previousDebt: debt,
                    totalAmount,
                    status,
                    billId: currentBill?._id || null,
                    isAutoRollover: !currentBill && !!prevBill,
                    hasPrevRecord: !!prevBill,
                    note: currentBill?.note || ''
                });
            }

            // 2. Bổ sung các phòng chưa có hợp đồng
            for (const r of ownedRooms) {
                const rId = String(r._id);
                if (seenRoomIds.has(rId)) continue;
                seenRoomIds.add(rId);

                const currentBill = currentBills.find(b => String(b.room?._id || b.room) === rId);
                const prevBill = prevBills.find(b => String(b.room?._id || b.room) === rId);

                const elecRate = 3500;
                const waterRate = 20000;
                const roomRent = Number(r.price) || 0;

                const elecPrev = currentBill ? currentBill.electric.previousNumber : (prevBill ? prevBill.electric.currentNumber : 0);
                const elecCurr = currentBill ? (currentBill.electric.currentNumber !== undefined ? currentBill.electric.currentNumber : '') : '';
                const elecUsage = elecCurr !== '' ? Math.max(0, Number(elecCurr) - Number(elecPrev)) : 0;
                const elecTotal = elecUsage * elecRate;

                const waterPrev = currentBill ? currentBill.water.previousNumber : (prevBill ? prevBill.water.currentNumber : 0);
                const waterCurr = currentBill ? (currentBill.water.currentNumber !== undefined ? currentBill.water.currentNumber : '') : '';
                const waterUsage = waterCurr !== '' ? Math.max(0, Number(waterCurr) - Number(waterPrev)) : 0;
                const waterTotal = waterUsage * waterRate;

                const defaultOtherFees = [];
                if (r.extraFees?.wifi) defaultOtherFees.push({ name: 'Wifi', amount: r.extraFees.wifi });
                if (r.extraFees?.trash) defaultOtherFees.push({ name: 'Rác', amount: r.extraFees.trash });

                const otherFees = (currentBill?.otherFees && currentBill.otherFees.length > 0) ? currentBill.otherFees : defaultOtherFees;
                const otherTotal = otherFees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
                const debt = currentBill ? (currentBill.previousDebt || 0) : 0;
                const totalAmount = currentBill ? currentBill.totalAmount : (roomRent + elecTotal + waterTotal + otherTotal + debt);
                const status = currentBill ? currentBill.status : (elecCurr !== '' ? 'unpaid' : 'draft');

                rows.push({
                    id: `row_r_${r._id}`,
                    contractId: null,
                    roomId: r._id,
                    roomNumber: r.room_number || r.title,
                    propertyName: r.property_name || 'Khu trọ SmartStay',
                    tenantName: r.tenant?.name || 'Phòng trống',
                    tenantPhone: r.tenant?.phone || '',
                    monthlyRent: roomRent,
                    electricPrice: elecRate,
                    electricPrevious: elecPrev,
                    electricCurrent: elecCurr,
                    electricUsage,
                    electricTotal,
                    waterPrice: waterRate,
                    waterPrevious: waterPrev,
                    waterCurrent: waterCurr,
                    waterUsage,
                    waterTotal,
                    otherFees,
                    otherTotal,
                    previousDebt: debt,
                    totalAmount,
                    status,
                    billId: currentBill?._id || null,
                    isAutoRollover: !currentBill && !!prevBill,
                    hasPrevRecord: !!prevBill,
                    note: currentBill?.note || ''
                });
            }

            return res.status(200).json({
                success: true,
                month,
                year,
                prevMonth,
                prevYear,
                count: rows.length,
                data: rows
            });
        }

        // Mock Fallback
        const mockRows = getFallbackGridRows(month, year, prevMonth, prevYear);
        return res.status(200).json({
            success: true,
            month,
            year,
            prevMonth,
            prevYear,
            count: mockRows.length,
            data: mockRows
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tải bảng chốt số: ' + error.message });
    }
});

// 0.2 Lưu hàng loạt bảng chốt số & Lập hóa đơn
router.post('/batch-save-grid', protect, authorize('landlord', 'admin', 'employee'), async (req, res) => {
    try {
        const { month, year, rows, createBills = false } = req.body;
        if (!month || !year || !Array.isArray(rows)) {
            return res.status(400).json({ success: false, message: 'Dữ liệu gửi lên không hợp lệ.' });
        }

        const isDbConnected = req.app.locals.isDbConnected;
        const currentUserId = req.user._id || req.user.id;

        if (isDbConnected) {
            const savedResults = [];

            for (const row of rows) {
                if (!row.roomId && !row.contractId) continue;

                const elPrev = Number(row.electricPrevious) || 0;
                const elCurr = row.electricCurrent !== '' && row.electricCurrent !== null ? Math.max(Number(row.electricCurrent) || 0, elPrev) : elPrev;
                const elUsage = elCurr - elPrev;
                const elRate = Number(row.electricPrice) || 3500;
                const elTotal = elUsage * elRate;

                const waPrev = Number(row.waterPrevious) || 0;
                const waCurr = row.waterCurrent !== '' && row.waterCurrent !== null ? Math.max(Number(row.waterCurrent) || 0, waPrev) : waPrev;
                const waUsage = waCurr - waPrev;
                const waRate = Number(row.waterPrice) || 20000;
                const waTotal = waUsage * waRate;

                const parsedOtherFees = Array.isArray(row.otherFees) ? row.otherFees : [];
                const otherTotal = parsedOtherFees.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                const prevDebt = Number(row.previousDebt) || 0;
                const monthlyRent = Number(row.monthlyRent) || 0;
                const totalAmount = monthlyRent + elTotal + waTotal + otherTotal + prevDebt;

                let bill;
                if (row.billId) {
                    bill = await Bill.findById(row.billId);
                } else if (row.contractId) {
                    bill = await Bill.findOne({ contract: row.contractId, month: Number(month), year: Number(year) });
                } else if (row.roomId) {
                    bill = await Bill.findOne({ room: row.roomId, month: Number(month), year: Number(year) });
                }

                if (bill) {
                    bill.electric = {
                        previousNumber: elPrev,
                        currentNumber: elCurr,
                        usage: elUsage,
                        pricePerKwh: elRate,
                        total: elTotal,
                        meterPhotoUrl: row.electricPhoto || bill.electric?.meterPhotoUrl || ''
                    };
                    bill.water = {
                        previousNumber: waPrev,
                        currentNumber: waCurr,
                        usage: waUsage,
                        pricePerM3: waRate,
                        total: waTotal,
                        meterPhotoUrl: row.waterPhoto || bill.water?.meterPhotoUrl || ''
                    };
                    bill.otherFees = parsedOtherFees;
                    bill.previousDebt = prevDebt;
                    bill.monthlyRent = monthlyRent;
                    bill.totalAmount = totalAmount;
                    if (row.status) bill.status = row.status;
                    if (row.note !== undefined) bill.note = row.note;
                    await bill.save();
                    savedResults.push(bill);
                } else {
                    const newBill = await Bill.create({
                        contract: row.contractId || undefined,
                        room: row.roomId,
                        roomNumber: row.roomNumber || '',
                        landlord: currentUserId,
                        tenant: row.tenantId || undefined,
                        tenantName: row.tenantName || '',
                        month: Number(month),
                        year: Number(year),
                        billingDate: new Date(),
                        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                        monthlyRent,
                        electric: {
                            previousNumber: elPrev,
                            currentNumber: elCurr,
                            usage: elUsage,
                            pricePerKwh: elRate,
                            total: elTotal,
                            meterPhotoUrl: row.electricPhoto || ''
                        },
                        water: {
                            previousNumber: waPrev,
                            currentNumber: waCurr,
                            usage: waUsage,
                            pricePerM3: waRate,
                            total: waTotal,
                            meterPhotoUrl: row.waterPhoto || ''
                        },
                        otherFees: parsedOtherFees,
                        previousDebt: prevDebt,
                        totalAmount,
                        status: row.status || (createBills ? 'unpaid' : 'unpaid'),
                        note: row.note || ''
                    });
                    savedResults.push(newBill);
                }
            }

            return res.status(200).json({
                success: true,
                message: createBills
                    ? `Đã chốt số và phát hành thành công ${savedResults.length} hóa đơn Tháng ${month}/${year}!`
                    : `Đã lưu thành công dữ liệu chốt số của ${savedResults.length} phòng!`,
                count: savedResults.length,
                data: savedResults
            });
        }

        // Fallback
        saveFallbackGridRows(month, year, rows);
        return res.status(200).json({
            success: true,
            message: createBills
                ? `Đã chốt số và phát hành ${rows.length} hóa đơn Tháng ${month}/${year} (Local Dev)!`
                : `Đã lưu bảng chốt số Tháng ${month}/${year} thành công (${rows.length} phòng - Local Dev)!`,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lưu bảng chốt số: ' + error.message });
    }
});

// 1. TẠO HÓA ĐƠN TIỀN TRỌ & ĐIỆN NƯỚC MINH BẠCH (CHỦ TRỌ / ADMIN)
router.post('/', protect, authorize('landlord', 'admin', 'employee'), async (req, res) => {
    try {
        const {
            contractId,
            month,
            year,
            dueDate,
            electricPrevious,
            electricCurrent,
            electricPhoto,
            waterPrevious,
            waterCurrent,
            waterPhoto,
            otherFees,
            previousDebt,
            note
        } = req.body;

        if (!contractId || !month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mã hợp đồng, tháng và năm của hóa đơn.'
            });
        }

        const isDbConnected = req.app.locals.isDbConnected;
        const currentUserId = req.user._id || req.user.id;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';

        if (isDbConnected) {
            const contract = await Contract.findById(contractId).populate('room tenant landlord');
            if (!contract) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng tương ứng.' });
            }

            // Kiểm tra quyền chủ trọ
            if (!isAdmin && !isSameId(contract.landlord._id || contract.landlord, currentUserId)) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền lập hóa đơn cho hợp đồng này.' });
            }

            const electricPrice = Number(contract.electricPrice) || 3500;
            const waterPrice = Number(contract.waterPrice) || 20000;
            const monthlyRent = Number(contract.monthlyRent) || 0;

            const elPrev = Number(electricPrevious) || 0;
            const elCurr = Math.max(Number(electricCurrent) || 0, elPrev);
            const elUsage = elCurr - elPrev;
            const elTotal = elUsage * electricPrice;

            const waPrev = Number(waterPrevious) || 0;
            const waCurr = Math.max(Number(waterCurrent) || 0, waPrev);
            const waUsage = waCurr - waPrev;
            const waTotal = waUsage * waterPrice;

            const parsedOtherFees = Array.isArray(otherFees) ? otherFees : [];
            const otherTotal = parsedOtherFees.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
            const prevDebt = Number(previousDebt) || 0;

            const totalAmount = monthlyRent + elTotal + waTotal + otherTotal + prevDebt;

            const newBill = await Bill.create({
                contract: contract._id,
                room: contract.room?._id || contract.room,
                landlord: contract.landlord?._id || contract.landlord,
                tenant: contract.tenant?._id || contract.tenant,
                month: Number(month),
                year: Number(year),
                billingDate: new Date(),
                dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Hạn 5 ngày
                monthlyRent,
                previousDebt: prevDebt,
                electric: {
                    previousNumber: elPrev,
                    currentNumber: elCurr,
                    usage: elUsage,
                    pricePerKwh: electricPrice,
                    total: elTotal,
                    meterPhotoUrl: electricPhoto || ''
                },
                water: {
                    previousNumber: waPrev,
                    currentNumber: waCurr,
                    usage: waUsage,
                    pricePerM3: waterPrice,
                    total: waTotal,
                    meterPhotoUrl: waterPhoto || ''
                },
                otherFees: parsedOtherFees,
                totalAmount,
                status: 'unpaid',
                note: note || ''
            });

            const populatedBill = await Bill.findById(newBill._id)
                .populate('room', 'title address')
                .populate('tenant', 'fullName phone email')
                .populate('landlord', 'fullName phone email');

            return res.status(201).json({
                success: true,
                message: `Lập hóa đơn Tháng ${month}/${year} thành công với chứng từ công tơ minh bạch!`,
                data: populatedBill
            });
        }

        // Mock mode
        res.status(201).json({
            success: true,
            message: 'Đã lập hóa đơn tháng (Local Dev Mock)',
            data: {
                _id: 'bill_' + Date.now(),
                contract: contractId,
                month,
                year,
                totalAmount: 3250000,
                status: 'unpaid'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tạo hóa đơn: ' + error.message });
    }
});

// 2. LẤY DANH SÁCH HÓA ĐƠN CHO CHỦ TRỌ
router.get('/landlord', protect, authorize('landlord', 'admin', 'employee'), async (req, res) => {
    try {
        const isDbConnected = req.app.locals.isDbConnected;
        const currentUserId = req.user._id || req.user.id;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';

        if (isDbConnected) {
            const query = isAdmin ? {} : { landlord: currentUserId };
            const bills = await Bill.find(query)
                .sort({ createdAt: -1 })
                .populate('room', 'title address')
                .populate('tenant', 'fullName phone email')
                .populate('contract', 'startDate endDate durationMonths');

            return res.status(200).json({
                success: true,
                count: bills.length,
                data: bills
            });
        }

        res.status(200).json({ success: true, count: 0, data: [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. LẤY HÓA ĐƠN CỦA SINH VIÊN ĐANG ĐĂNG NHẬP
router.get('/my-bills', protect, async (req, res) => {
    try {
        const isDbConnected = req.app.locals.isDbConnected;
        const currentUserId = req.user._id || req.user.id;

        if (isDbConnected) {
            const bills = await Bill.find({ tenant: currentUserId })
                .sort({ createdAt: -1 })
                .populate('room', 'title address images image_url')
                .populate('landlord', 'fullName phone email')
                .populate('contract', 'startDate endDate monthlyRent electricPrice waterPrice');

            return res.status(200).json({
                success: true,
                count: bills.length,
                data: bills
            });
        }

        res.status(200).json({ success: true, count: 0, data: [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. LẤY TOÀN BỘ HÓA ĐƠN CỦA MỘT HỢP ĐỒNG CỤ THỂ
router.get('/contract/:contractId', protect, async (req, res) => {
    try {
        const { contractId } = req.params;
        const isDbConnected = req.app.locals.isDbConnected;

        if (isDbConnected) {
            const bills = await Bill.find({ contract: contractId })
                .sort({ month: -1, year: -1 })
                .populate('room', 'title address')
                .populate('tenant', 'fullName phone')
                .populate('landlord', 'fullName phone');

            return res.status(200).json({
                success: true,
                count: bills.length,
                data: bills
            });
        }

        res.status(200).json({ success: true, count: 0, data: [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 5. SINH VIÊN XÁC NHẬN ĐÃ THANH TOÁN & GỬI ẢNH BIÊN LAI CHUYỂN KHOẢN
router.patch('/:id/pay', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentProofUrl } = req.body;
        const isDbConnected = req.app.locals.isDbConnected;
        const currentUserId = req.user._id || req.user.id;

        if (isDbConnected) {
            const bill = await Bill.findById(id);
            if (!bill) return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn.' });

            if (!isSameId(bill.tenant, currentUserId) && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền thanh toán hóa đơn này.' });
            }

            bill.status = 'paid';
            bill.paidAt = new Date();
            if (paymentProofUrl) bill.paymentProofUrl = paymentProofUrl;
            await bill.save();

            return res.status(200).json({
                success: true,
                message: 'Đã gửi thông báo thanh toán và ảnh hóa đơn cho Chủ trọ xác nhận!',
                data: bill
            });
        }

        res.status(200).json({ success: true, message: 'Đã thanh toán (Local Dev).' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 6. CHỦ TRỌ XÁC NHẬN ĐÃ NHẬN TIỀN
router.patch('/:id/confirm', protect, authorize('landlord', 'admin', 'employee'), async (req, res) => {
    try {
        const { id } = req.params;
        const isDbConnected = req.app.locals.isDbConnected;
        const currentUserId = req.user._id || req.user.id;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';

        if (isDbConnected) {
            const bill = await Bill.findById(id);
            if (!bill) return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn.' });

            if (!isAdmin && !isSameId(bill.landlord, currentUserId)) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền xác nhận hóa đơn này.' });
            }

            bill.status = 'confirmed';
            bill.confirmedAt = new Date();
            await bill.save();

            return res.status(200).json({
                success: true,
                message: 'Chủ trọ đã xác nhận thu tiền phòng & điện nước thành công!',
                data: bill
            });
        }

        res.status(200).json({ success: true, message: 'Đã xác nhận thu tiền (Local Dev).' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
