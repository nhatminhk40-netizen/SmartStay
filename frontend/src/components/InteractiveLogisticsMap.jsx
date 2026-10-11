import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Navigation,
  ExternalLink,
  CheckCircle2,
  Loader2,
  MapPin,
  Crosshair,
  ArrowRight,
  Sparkles,
  Search,
  Globe,
  Send
} from "lucide-react";

// Danh mục các địa điểm & khu vực phổ biến tại Cần Thơ để ánh xạ tức thời
export const CAN_THO_KNOWN_PLACES = [
  {
    keyword: "ecolodge",
    name: "Can Tho Ecolodge",
    address: "Can Tho Ecolodge, 542, Khu vực 3, Ba Láng, Cái Răng, Cần Thơ",
    lat: 9.9878,
    lng: 105.7415
  },
  {
    keyword: "vua hùng",
    name: "Đền thờ Vua Hùng",
    address: "Đền thờ Vua Hùng, Võ Văn Kiệt, Bình Thủy, Cần Thơ",
    lat: 10.0676,
    lng: 105.7317
  },
  {
    keyword: "supper trọ",
    name: "Supper Trọ 686",
    address: "Supper Trọ 686, Ấp Mỹ Phước, An Bình, Ninh Kiều, Cần Thơ",
    lat: 10.0090,
    lng: 105.7380
  },
  {
    keyword: "lotte",
    name: "LOTTE Mart Cần Thơ",
    address: "LOTTE Mart Cần Thơ, 84 Đ. Mậu Thân, An Hòa, Ninh Kiều, Cần Thơ",
    lat: 10.0427,
    lng: 105.7670
  },
  {
    keyword: "đại học fpt",
    name: "ĐH FPT Cần Thơ",
    address: "Số 600, Đ. Nguyễn Văn Cừ nối dài, An Bình, Ninh Kiều, Cần Thơ",
    lat: 10.0125,
    lng: 105.7325
  },
  {
    keyword: "khu 2",
    name: "ĐH Cần Thơ (Khu 2)",
    address: "Khu II, Đ. 3 Tháng 2, Xuân Khánh, Ninh Kiều, Cần Thơ",
    lat: 10.0299,
    lng: 105.7706
  },
  {
    keyword: "y dược",
    name: "ĐH Y Dược Cần Thơ",
    address: "179 Đ. Nguyễn Văn Cừ, An Khánh, Ninh Kiều, Cần Thơ",
    lat: 10.0350,
    lng: 105.7570
  },
  {
    keyword: "nam cần thơ",
    name: "ĐH Nam Cần Thơ",
    address: "168 Đ. Nguyễn Văn Cừ nối dài, An Bình, Ninh Kiều, Cần Thơ",
    lat: 9.9960,
    lng: 105.7350
  },
  {
    keyword: "hẻm 51",
    name: "Hẻm 51 Đường 3/2",
    address: "Hẻm 51, Đ. 3 Tháng 2, Xuân Khánh, Ninh Kiều, Cần Thơ",
    lat: 10.0270,
    lng: 105.7720
  },
  {
    keyword: "91b",
    name: "KDC 91B, An Khánh",
    address: "KDC 91B, Đ. Nguyễn Hiền, An Khánh, Ninh Kiều, Cần Thơ",
    lat: 10.0380,
    lng: 105.7520
  },
  {
    keyword: "hồng phát",
    name: "KDC Hồng Phát",
    address: "KDC Hồng Phát, Đ. Hoàng Quốc Việt, An Bình, Ninh Kiều, Cần Thơ",
    lat: 10.0150,
    lng: 105.7400
  },
  {
    keyword: "hưng lợi",
    name: "Khu trọ Hưng Lợi",
    address: "Đ. Tầm Vu, Hưng Lợi, Ninh Kiều, Cần Thơ",
    lat: 10.0180,
    lng: 105.7650
  },
  {
    keyword: "ninh kiều",
    name: "Bến Ninh Kiều",
    address: "Bến Ninh Kiều, Tân An, Ninh Kiều, Cần Thơ",
    lat: 10.0335,
    lng: 105.7875
  },
  {
    keyword: "cái răng",
    name: "Chợ nổi Cái Răng",
    address: "Đ. Lê Bình, Cái Răng, Cần Thơ",
    lat: 9.9980,
    lng: 105.7850
  }
];

// Hàm phân tích tọa độ nếu chuỗi có dạng "10.02102, 105.7013"
export function parseCoordinates(text) {
  if (!text || typeof text !== "string") return null;
  const match = text.match(/(-?\d+\.\d+)[\s,]+(-?\d+\.\d+)/);
  if (match) {
    const p1 = parseFloat(match[1]);
    const p2 = parseFloat(match[2]);
    if (p1 >= 8 && p1 <= 12 && p2 >= 104 && p2 <= 108) {
      return { lat: p1, lng: p2 };
    }
    if (p2 >= 8 && p2 <= 12 && p1 >= 104 && p1 <= 108) {
      return { lat: p2, lng: p1 };
    }
  }
  return null;
}

// Hàm Geocoding chuyển đổi tên địa điểm sang tọa độ thực tế tại Cần Thơ
export async function geocodePlaceName(name) {
  if (!name || typeof name !== "string") return null;
  const clean = name.trim();

  // 1. Tọa độ trực tiếp
  const directCoord = parseCoordinates(clean);
  if (directCoord) {
    return {
      name: `Tọa độ (${directCoord.lat.toFixed(5)}, ${directCoord.lng.toFixed(5)})`,
      address: clean,
      lat: directCoord.lat,
      lng: directCoord.lng
    };
  }

  // 2. Tra cứu từ điển địa danh Cần Thơ
  const lower = clean.toLowerCase();
  const matched = CAN_THO_KNOWN_PLACES.find(
    (p) => lower.includes(p.keyword.toLowerCase()) || p.name.toLowerCase().includes(lower)
  );
  if (matched) {
    return {
      name: matched.name,
      address: clean.length > matched.name.length ? clean : matched.address,
      lat: matched.lat,
      lng: matched.lng
    };
  }

  // 3. Tra cứu qua Photon Komoot API (rất nhạy và chính xác cao theo tọa độ Cần Thơ)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(clean)}&lat=10.03&lon=105.78&limit=3`;
    const res = await fetch(photonUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lon, lat] = feature.geometry.coordinates;
        if (lat >= 9.5 && lat <= 10.6 && lon >= 105.2 && lon <= 106.2) {
          const props = feature.properties || {};
          const title = props.name || props.street || clean;
          return {
            name: title,
            address: `${title}${props.city ? `, ${props.city}` : ""}, Cần Thơ`,
            lat,
            lng: lon
          };
        }
      }
    }
  } catch (err) {
    console.warn("Lỗi Photon Geocoding:", err);
  }

  // 4. Tra cứu qua OpenStreetMap Nominatim Geocoding API với viewbox Cần Thơ
  try {
    const query = clean.includes("Cần Thơ") ? clean : `${clean}, Cần Thơ, Việt Nam`;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=105.50,9.80,105.90,10.20&bounded=0&limit=1`,
      { headers: { "User-Agent": "SmartStay-CanTho-App" } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          name: clean.split(",")[0],
          address: data[0].display_name || clean,
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    }
  } catch (err) {
    console.warn("Lỗi Nominatim Geocoding:", err);
  }

  return null;
}

// Hàm tính khoảng cách đại vòng (Haversine) kèm hệ số uốn lượn đường phố Cần Thơ (1.35)
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1.35 * 10) / 10;
}

// Hàm tính toán tuyến đường lái xe thực tế theo mạng lưới giao thông đường bộ (OSRM)
export async function fetchRealRoadRoute(origin, destination) {
  if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
    return null;
  }
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("OSRM routing request failed");
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
      const durationMin = Math.round(route.duration / 60);
      const latlngs = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
      return {
        distanceKm: Math.max(1, distanceKm),
        durationMin: Math.max(5, durationMin),
        latlngs,
        summary: route.legs?.[0]?.summary || "Tuyến đường tối ưu Cần Thơ"
      };
    }
  } catch (err) {
    console.warn("Lỗi tính lộ trình OSRM, kích hoạt chế độ dự phòng:", err);
  }

  // Chế độ dự phòng: Tính khoảng cách đường bộ theo Haversine và vẽ đường thẳng kết nối
  const estKm = haversineDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
  return {
    distanceKm: Math.max(1, estKm),
    durationMin: Math.max(5, Math.round(estKm * 2)),
    latlngs: [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng]
    ],
    summary: "Đường bộ Cần Thơ (Ước lượng)"
  };
}

// Marker HTML ghim A và B
const createPinIcon = (label, color) => {
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="position: relative; width: 34px; height: 44px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
        <div style="width: 32px; height: 32px; background-color: ${color}; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; display: flex; align-items: center; justify-content: center;">
          <span style="transform: rotate(45deg); color: white; font-weight: 900; font-size: 13px; font-family: system-ui, sans-serif;">${label}</span>
        </div>
      </div>
    `,
    iconSize: [34, 44],
    iconAnchor: [17, 40],
    popupAnchor: [0, -40]
  });
};

const iconA = createPinIcon("A", "#10b981"); // Điểm đón: Xanh lục
const iconB = createPinIcon("B", "#f97316"); // Điểm đến: Cam SmartStay

export default function InteractiveLogisticsMap({
  pickup,
  dropoff,
  onPickupChange,
  onDropoffChange,
  distance,
  onDistanceChange,
  estimatedDuration,
  onDurationChange
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markerARef = useRef(null);
  const markerBRef = useRef(null);
  const routeLineRef = useRef(null);
  const routeShadowRef = useRef(null);

  const [mapType, setMapType] = useState("satellite"); // 'satellite' (Vệ tinh Google) hoặc 'roadmap' (Bản đồ Google)
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [clickMode, setClickMode] = useState("pickup"); // 'pickup' hoặc 'dropoff'
  const clickModeRef = useRef(clickMode);
  const [searchInput, setSearchInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const [syncingUrl, setSyncingUrl] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState({ distanceKm: distance, durationMin: 15 });

  useEffect(() => {
    clickModeRef.current = clickMode;
  }, [clickMode]);

  // Cập nhật Layer bản đồ Google (Chuẩn đường hoặc Vệ tinh Hybrid có nhãn đường phố)
  const updateTileLayer = (type) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    // Google Maps Tiles: lyrs=y (Satellite Hybrid kèm tên đường) hoặc lyrs=m (Standard Roadmap)
    const tileUrl =
      type === "satellite"
        ? "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        : "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";

    tileLayerRef.current = L.tileLayer(tileUrl, {
      subdomains: ["0", "1", "2", "3"],
      maxZoom: 20,
      attribution: "Google Maps"
    }).addTo(map);
  };

  // Khởi tạo bản đồ Leaflet tích hợp Google Maps
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const defaultCenter = [pickup?.lat || 10.025, pickup?.lng || 105.755];
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 14,
      zoomControl: true
    });

    mapInstanceRef.current = map;
    updateTileLayer(mapType);

    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener("resize", handleResize);

    // Click trực tiếp trên bản đồ để cắm ghim A hoặc B (Giữ nguyên chế độ đang chọn để người dùng dễ tinh chỉnh)
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      const coordStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      if (clickModeRef.current === "pickup") {
        onPickupChange({
          name: `Vị trí ghim A (${coordStr})`,
          address: `Tọa độ: ${coordStr} - Cần Thơ`,
          lat,
          lng
        });
      } else {
        onDropoffChange({
          name: `Vị trí ghim B (${coordStr})`,
          address: `Tọa độ: ${coordStr} - Cần Thơ`,
          lat,
          lng
        });
      }
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Đổi loại bản đồ Google (Bản đồ / Vệ tinh)
  useEffect(() => {
    updateTileLayer(mapType);
  }, [mapType]);

  // Cập nhật ghim và vẽ đường đi thực tế khi vị trí A hoặc B thay đổi
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Cập nhật ghim A
    if (pickup?.lat && pickup?.lng) {
      if (!markerARef.current) {
        markerARef.current = L.marker([pickup.lat, pickup.lng], {
          icon: iconA,
          draggable: true
        }).addTo(map);

        markerARef.current.on("dragend", (e) => {
          const { lat, lng } = e.target.getLatLng();
          const coordStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          onPickupChange({
            name: `Ghim mới (${coordStr})`,
            address: `Tọa độ: ${coordStr} - Cần Thơ`,
            lat,
            lng
          });
        });
      } else {
        markerARef.current.setLatLng([pickup.lat, pickup.lng]);
      }
      markerARef.current.bindPopup(`<b>Điểm đón (A):</b><br/>${pickup.address || pickup.name}`);
    }

    // 2. Cập nhật ghim B
    if (dropoff?.lat && dropoff?.lng) {
      if (!markerBRef.current) {
        markerBRef.current = L.marker([dropoff.lat, dropoff.lng], {
          icon: iconB,
          draggable: true
        }).addTo(map);

        markerBRef.current.on("dragend", (e) => {
          const { lat, lng } = e.target.getLatLng();
          const coordStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          onDropoffChange({
            name: `Ghim mới (${coordStr})`,
            address: `Tọa độ: ${coordStr} - Cần Thơ`,
            lat,
            lng
          });
        });
      } else {
        markerBRef.current.setLatLng([dropoff.lat, dropoff.lng]);
      }
      markerBRef.current.bindPopup(`<b>Điểm đến (B):</b><br/>${dropoff.address || dropoff.name}`);
    }

    // 3. Tự động tính lộ trình đường đi thực tế và vẽ tuyến đường
    if (pickup?.lat && pickup?.lng && dropoff?.lat && dropoff?.lng) {
      setLoadingRoute(true);
      fetchRealRoadRoute(pickup, dropoff).then((result) => {
        setLoadingRoute(false);
        if (result && result.latlngs.length > 0) {
          if (routeShadowRef.current) map.removeLayer(routeShadowRef.current);
          if (routeLineRef.current) map.removeLayer(routeLineRef.current);

          routeShadowRef.current = L.polyline(result.latlngs, {
            color: "#0f172a",
            weight: 8,
            opacity: 0.3
          }).addTo(map);

          routeLineRef.current = L.polyline(result.latlngs, {
            color: "#f97316",
            weight: 5,
            opacity: 0.95,
            lineCap: "round",
            lineJoin: "round"
          }).addTo(map);

          const bounds = L.latLngBounds(result.latlngs);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });

          setRouteInfo({
            distanceKm: result.distanceKm,
            durationMin: result.durationMin
          });
          onDistanceChange?.(result.distanceKm);
          onDurationChange?.(result.durationMin);
        }
      });
    }
  }, [pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng]);

  // Phân tích và xử lý link Google Maps trực tiếp
  const parseGoogleMapsUrlString = async (urlText) => {
    if (!urlText.trim()) return;
    setSyncingUrl(true);
    setSyncStatus("⏳ Đang giải mã và định vị địa điểm từ Google Maps...");

    try {
      const cleanUrl = urlText.trim();

      // 1. Tọa độ trích xuất từ cấu trúc data=!4m...
      const dataCoordMatches = [...cleanUrl.matchAll(/(?:!2m2|!1m\d+)?!1d([0-9.]+)!2d([0-9.]+)/g)];
      let extractedDataCoords = dataCoordMatches.map((m) => ({
        lng: parseFloat(m[1]),
        lat: parseFloat(m[2])
      }));

      if (extractedDataCoords.length === 0) {
        const revMatches = [...cleanUrl.matchAll(/(?:!2m2|!1m\d+)?!2d([0-9.]+)!1d([0-9.]+)/g)];
        extractedDataCoords = revMatches.map((m) => ({
          lat: parseFloat(m[1]),
          lng: parseFloat(m[2])
        }));
      }

      // 2. Tọa độ @lat,lng
      const atMatch = cleanUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      const atCoord = atMatch ? { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) } : null;

      // 3. Bóc tách tên địa điểm từ URL /maps/dir/Origin/Destination/...
      let originName = "";
      let destName = "";

      if (cleanUrl.includes("/maps/dir/")) {
        const afterDir = cleanUrl.split("/maps/dir/")[1];
        const cleanDir = afterDir.split("/@")[0].split("/data=")[0].split("?")[0];
        const parts = cleanDir.split("/").filter(Boolean);

        if (parts.length >= 2) {
          originName = decodeURIComponent(parts[0].replace(/\+/g, " ")).trim();
          destName = decodeURIComponent(parts[1].replace(/\+/g, " ")).trim();
        } else if (parts.length === 1) {
          destName = decodeURIComponent(parts[0].replace(/\+/g, " ")).trim();
        }
      }

      try {
        const urlObj = new URL(cleanUrl.startsWith("http") ? cleanUrl : `https://google.com/${cleanUrl}`);
        const qOrigin = urlObj.searchParams.get("origin") || urlObj.searchParams.get("saddr");
        const qDest = urlObj.searchParams.get("destination") || urlObj.searchParams.get("daddr");
        if (qOrigin && !originName) originName = decodeURIComponent(qOrigin.replace(/\+/g, " ")).trim();
        if (qDest && !destName) destName = decodeURIComponent(qDest.replace(/\+/g, " ")).trim();
      } catch (err) {}

      if (!destName && cleanUrl.includes("/maps/place/")) {
        const afterPlace = cleanUrl.split("/maps/place/")[1];
        const placePart = afterPlace.split("/@")[0].split("/data=")[0].split("?")[0];
        if (placePart) {
          destName = decodeURIComponent(placePart.replace(/\+/g, " ")).trim();
        }
      }

      let resolvedPickup = null;
      let resolvedDropoff = null;

      if (extractedDataCoords.length >= 2) {
        resolvedPickup = {
          name: originName ? originName.split(",")[0].trim() : "Điểm đón Google Maps",
          address: originName || `Tọa độ: ${extractedDataCoords[0].lat.toFixed(5)}, ${extractedDataCoords[0].lng.toFixed(5)}`,
          lat: extractedDataCoords[0].lat,
          lng: extractedDataCoords[0].lng
        };
        resolvedDropoff = {
          name: destName ? destName.split(",")[0].trim() : "Điểm đến Google Maps",
          address: destName || `Tọa độ: ${extractedDataCoords[extractedDataCoords.length - 1].lat.toFixed(5)}, ${extractedDataCoords[extractedDataCoords.length - 1].lng.toFixed(5)}`,
          lat: extractedDataCoords[extractedDataCoords.length - 1].lat,
          lng: extractedDataCoords[extractedDataCoords.length - 1].lng
        };
      } else {
        if (originName) resolvedPickup = await geocodePlaceName(originName);
        if (destName) resolvedDropoff = await geocodePlaceName(destName);

        if (!resolvedPickup && extractedDataCoords.length >= 1) {
          resolvedPickup = {
            name: originName || "Điểm đón Google Maps",
            address: originName || `Tọa độ: ${extractedDataCoords[0].lat.toFixed(5)}, ${extractedDataCoords[0].lng.toFixed(5)}`,
            lat: extractedDataCoords[0].lat,
            lng: extractedDataCoords[0].lng
          };
        }
        if (!resolvedDropoff && atCoord) {
          resolvedDropoff = {
            name: destName || "Điểm đến Google Maps",
            address: destName || `Tọa độ: ${atCoord.lat.toFixed(5)}, ${atCoord.lng.toFixed(5)}`,
            lat: atCoord.lat,
            lng: atCoord.lng
          };
        }
      }

      if (resolvedPickup && resolvedDropoff) {
        onPickupChange(resolvedPickup);
        onDropoffChange(resolvedDropoff);

        const routeRes = await fetchRealRoadRoute(resolvedPickup, resolvedDropoff);
        const dist = routeRes?.distanceKm || 1;
        const dur = routeRes?.durationMin || 10;
        onDistanceChange?.(dist);
        onDurationChange?.(dur);
        setRouteInfo({ distanceKm: dist, durationMin: dur });

        setSyncStatus(
          `✅ Đã đồng bộ thành công: ${resolvedPickup.name} ➔ ${resolvedDropoff.name} (${dist} km, ~${dur} phút)!`
        );
        setSearchInput("");
        setSyncingUrl(false);
        return;
      } else if (resolvedDropoff) {
        onDropoffChange(resolvedDropoff);
        const routeRes = await fetchRealRoadRoute(pickup, resolvedDropoff);
        const dist = routeRes?.distanceKm || 1;
        const dur = routeRes?.durationMin || 10;
        onDistanceChange?.(dist);
        onDurationChange?.(dur);
        setRouteInfo({ distanceKm: dist, durationMin: dur });
        setSyncStatus(`✅ Đã đồng bộ điểm đến: ${resolvedDropoff.name} (${dist} km)!`);
        setSearchInput("");
        setSyncingUrl(false);
        return;
      } else if (resolvedPickup) {
        onPickupChange(resolvedPickup);
        setSyncStatus(`✅ Đã đồng bộ điểm đón: ${resolvedPickup.name}!`);
        setSearchInput("");
        setSyncingUrl(false);
        return;
      }

      setSyncStatus("⚠️ Không tìm thấy địa danh tương ứng trên bản đồ Cần Thơ. Vui lòng kiểm tra lại link.");
    } catch (err) {
      console.error(err);
      setSyncStatus("❌ Lỗi xử lý link. Vui lòng thử lại!");
    } finally {
      setSyncingUrl(false);
    }
  };

  // Tìm kiếm địa điểm hoặc giải mã link Google Maps khi bấm Enter hoặc Tìm kiếm
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    // Kiểm tra nếu là link Google Maps
    if (
      searchInput.includes("google.com/maps") ||
      searchInput.includes("maps.app.goo.gl") ||
      searchInput.includes("/maps/dir/") ||
      searchInput.includes("/maps/place/")
    ) {
      await parseGoogleMapsUrlString(searchInput);
      setShowSuggestions(false);
      return;
    }

    // Kiểm tra nếu là tọa độ trực tiếp
    const direct = parseCoordinates(searchInput);
    if (direct) {
      const loc = {
        name: `Tọa độ (${direct.lat.toFixed(5)}, ${direct.lng.toFixed(5)})`,
        address: `Tọa độ: ${direct.lat.toFixed(5)}, ${direct.lng.toFixed(5)} - Cần Thơ`,
        lat: direct.lat,
        lng: direct.lng
      };
      if (clickMode === "pickup") {
        onPickupChange(loc);
      } else {
        onDropoffChange(loc);
      }
      setShowSuggestions(false);
      mapInstanceRef.current?.setView([direct.lat, direct.lng], 15);
      setSyncStatus(`✅ Đã định vị tọa độ: ${searchInput}`);
      return;
    }

    // Geocode qua từ điển, Photon hoặc OpenStreetMap
    setSyncingUrl(true);
    setSyncStatus("⏳ Đang tìm kiếm địa điểm...");
    const geocoded = await geocodePlaceName(searchInput);
    setSyncingUrl(false);
    if (geocoded) {
      if (clickMode === "pickup") {
        onPickupChange(geocoded);
      } else {
        onDropoffChange(geocoded);
      }
      setShowSuggestions(false);
      mapInstanceRef.current?.setView([geocoded.lat, geocoded.lng], 15);
      setSyncStatus(`✅ Đã định vị ${clickMode === "pickup" ? "Điểm đón A" : "Điểm đến B"}: ${geocoded.name}`);
    } else {
      setSyncStatus("⚠️ Không tìm thấy địa danh tự động. Hãy nhấp chuột trực tiếp lên bản đồ hoặc dán link/tọa độ Google Maps!");
    }
  };

  // Chọn từ gợi ý địa điểm Cần Thơ
  const handleSelectSuggestion = (place) => {
    const loc = {
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng
    };
    if (clickMode === "pickup") {
      onPickupChange(loc);
    } else {
      onDropoffChange(loc);
    }
    setSearchInput(place.name);
    setShowSuggestions(false);
    mapInstanceRef.current?.setView([place.lat, place.lng], 15);
    setSyncStatus(`✅ Đã chọn ${clickMode === "pickup" ? "Điểm đón A" : "Điểm đến B"}: ${place.name}`);
  };

  // Lấy vị trí GPS hiện tại từ thiết bị
  const handleGPS = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const { latitude, longitude } = pos.coords;
        const coordStr = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        const gpsLoc = {
          name: "Vị trí GPS của tôi",
          address: `Vị trí hiện tại (${coordStr} - Cần Thơ)`,
          lat: latitude,
          lng: longitude
        };
        if (clickMode === "pickup") {
          onPickupChange(gpsLoc);
        } else {
          onDropoffChange(gpsLoc);
        }
        mapInstanceRef.current?.setView([latitude, longitude], 15);
        setSyncStatus(`✅ Đã lấy vị trí GPS thành công: ${coordStr}`);
      },
      (err) => {
        setGpsLoading(false);
        alert("Không thể lấy vị trí GPS: " + err.message);
      },
      { timeout: 10000 }
    );
  };

  // Lọc gợi ý khi gõ
  const suggestions = CAN_THO_KNOWN_PLACES.filter((p) => {
    const q = searchInput.toLowerCase().trim();
    if (!q) return false;
    return (
      p.name.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.keyword.toLowerCase().includes(q)
    );
  }).slice(0, 5);

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(
    pickup?.lat ? `${pickup.lat},${pickup.lng}` : pickup?.address || "Đại học Cần Thơ"
  )}/${encodeURIComponent(
    dropoff?.lat ? `${dropoff.lat},${dropoff.lng}` : dropoff?.address || "Đại học FPT Cần Thơ"
  )}`;

  return (
    <div className="bg-white border-2 border-orange-200/90 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5">
      {/* 1. Tiêu đề Lộ trình & Bản đồ Google Maps */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
              Bản đồ lộ trình & vị trí Google Maps
            </h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://www.google.com/maps/@10.025,105.755,14z"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 transition"
            title="Mở Google Maps để tra cứu địa điểm và copy tọa độ nếu cần"
          >
            <ExternalLink className="w-3 h-3" /> Mở Google Maps
          </a>
          <span className="text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
            Google Maps Live
          </span>
        </div>
      </div>

      {/* 2. Chế độ chọn ghim A / B trước khi tìm kiếm để không bị nhầm */}
      <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
        <span className="text-[11px] font-bold text-slate-600 pl-1.5 hidden sm:inline">
          Chọn điểm cần chỉnh:
        </span>
        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
          <button
            type="button"
            onClick={() => setClickMode("pickup")}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              clickMode === "pickup"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white inline-block" />
            Ghim A (Điểm đón)
          </button>
          <button
            type="button"
            onClick={() => setClickMode("dropoff")}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              clickMode === "dropoff"
                ? "bg-orange-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 border border-white inline-block" />
            Ghim B (Điểm đến)
          </button>
        </div>
      </div>

      {/* 3. Thanh tìm kiếm địa điểm / dán link / tọa độ Google Maps */}
      <div className="relative">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="w-4 h-4 text-orange-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder={
              clickMode === "pickup"
                ? "Tìm địa chỉ ĐÓN (Ghim A): Tên đường, trọ hoặc dán link/tọa độ Google Maps..."
                : "Tìm địa chỉ ĐẾN (Ghim B): Tên đường, trọ hoặc dán link/tọa độ Google Maps..."
            }
            className="w-full h-11 pl-10 pr-24 rounded-2xl border border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200/50 text-xs text-slate-800 placeholder:text-slate-400 outline-none shadow-xs transition"
          />
          <button
            type="submit"
            disabled={syncingUrl}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
          >
            {syncingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Tìm kiếm"}
          </button>
        </form>

        {/* Dropdown gợi ý địa danh Cần Thơ */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-orange-200 rounded-2xl shadow-xl z-[500] overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-100">
            {suggestions.map((place, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSuggestion(place)}
                className="p-3 hover:bg-orange-50/70 cursor-pointer transition flex items-start gap-2.5 text-left"
              >
                <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-900">{place.name}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{place.address}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Hàng chức năng: GPS & Chuyển đổi loại bản đồ */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Nút GPS */}
        <button
          type="button"
          onClick={handleGPS}
          disabled={gpsLoading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-orange-200 bg-white hover:bg-orange-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-orange-500" />
          {gpsLoading ? "Đang lấy GPS..." : "Lấy vị trí GPS của tôi"}
        </button>

        {/* Nút chuyển đổi loại bản đồ Google */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
          <button
            type="button"
            onClick={() => setMapType("roadmap")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              mapType === "roadmap"
                ? "bg-orange-500 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Bản đồ Google
          </button>
          <button
            type="button"
            onClick={() => setMapType("satellite")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              mapType === "satellite"
                ? "bg-orange-500 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Vệ tinh Google
          </button>
        </div>
      </div>

      {/* Thông báo trạng thái đồng bộ */}
      {syncStatus && (
        <div className="text-xs font-semibold px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 animate-in fade-in">
          {syncStatus}
        </div>
      )}

      {/* 4. Khung bản đồ Leaflet chuẩn Google Maps */}
      <div className="relative rounded-2xl overflow-hidden border border-orange-200/90 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-80 sm:h-96 z-10" />

        {/* Thẻ hướng dẫn nổi ở góc dưới bên trái */}
        <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-sm border border-orange-200 shadow-md rounded-full px-3.5 py-1.5 flex items-center gap-2 text-xs text-slate-700 font-semibold pointer-events-none">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse flex-shrink-0" />
          <span>Chạm hoặc kéo ghim A/B đến đúng vị trí phòng trọ</span>
        </div>

        {loadingRoute && (
          <div className="absolute top-3 right-14 z-[400] bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-md text-xs font-bold text-orange-600 flex items-center gap-1.5 border border-orange-200">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang vẽ lộ trình...
          </div>
        )}
      </div>

      {/* 5. Chân trang: Khoảng cách và Mở Google Maps */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Navigation className="w-4 h-4 text-orange-500" />
          <span>
            Khoảng cách vận chuyển thực tế:{" "}
            <strong className="text-base text-orange-600 font-black">
              {distance || routeInfo.distanceKm} km
            </strong>
            {estimatedDuration ? ` (~${estimatedDuration} phút xe chạy)` : ""}
          </span>
        </div>

        <a
          href={googleMapsDirectionsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-orange-200 bg-white hover:bg-orange-50 text-slate-700 font-bold text-xs shadow-xs transition"
        >
          <span>Mở Google Maps</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
        </a>
      </div>
    </div>
  );
}
