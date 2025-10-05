"use client"

import { useEffect, useRef } from "react"
import type { HouseData, ZoneData, ViewMode } from "@/app/page"

interface BrazzavilleMapProps {
  viewMode: ViewMode
  houseData: HouseData[]
  zoneData: ZoneData[]
  onItemSelect: (item: HouseData | ZoneData | null) => void
  selectedItem: HouseData | ZoneData | null
  showLayer: boolean
}

// Color mapping functions
const getHouseUsageColor = (usage: number): string => {
  if (usage < 30) return "#3B82F6" // Blue - Low
  if (usage < 60) return "#10B981" // Green - Medium
  if (usage < 90) return "#F59E0B" // Yellow - High
  return "#EF4444" // Red - Very High
}

const getZoneUsageColor = (usage: number): string => {
  if (usage < 1500) return "#3B82F6" // Blue - Low
  if (usage < 3000) return "#10B981" // Green - Medium
  if (usage < 5000) return "#F59E0B" // Yellow - High
  return "#EF4444" // Red - Very High
}

const getZoneUsageOpacity = (usage: number): number => {
  return Math.min(0.3 + (usage / 8000) * 0.5, 0.8) // 0.3 to 0.8 opacity
}

export default function BrazzavilleMap({
  viewMode,
  houseData,
  zoneData,
  onItemSelect,
  selectedItem,
  showLayer,
}: BrazzavilleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const layersRef = useRef<any[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return

    // Dynamically import Leaflet
    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return

      // Republic of the Congo bounds
      const congoBounds: [[number, number], [number, number]] = [
        [-5.0, 11.0], // Southwest
        [-3.0, 19.0], // Northeast
      ]

      // Initialize map centered on Brazzaville
      mapInstanceRef.current = L.map(mapRef.current, {
        maxBounds: congoBounds,
        maxBoundsViscosity: 1.0,
      }).setView([-4.2634, 15.2429], 11)

      // Add tile layer with a modern style
      L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors, Tiles courtesy of Humanitarian OpenStreetMap Team",
        maxZoom: 18,
        minZoom: 9,
      }).addTo(mapInstanceRef.current)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
      layersRef.current = []
    }
  }, [])

  // Update layers when data or view mode changes
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === "undefined") return

    import("leaflet").then((L) => {
      // Clear existing layers
      layersRef.current.forEach((layer) => {
        if (layer.marker) mapInstanceRef.current.removeLayer(layer.marker)
        if (layer.polygon) mapInstanceRef.current.removeLayer(layer.polygon)
      })
      layersRef.current = []

      if (viewMode === "houses") {
        // Add house markers
        houseData.forEach((house) => {
          const color = getHouseUsageColor(house.usage)
          const size = 18 + (house.usage / 130) * 12 // Dynamic size based on usage

          const houseIcon = L.divIcon({
            className: "house-marker",
            html: `
              <div style="
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${Math.max(7, size * 0.35)}px;
                font-weight: 700;
                color: white;
                text-shadow: 1px 1px 1px rgba(0,0,0,0.8);
                cursor: pointer;
                transition: all 0.3s ease;
                opacity: ${showLayer ? 1 : 0.3};
                font-family: system-ui, -apple-system, sans-serif;
              " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
                ${house.usage.toFixed(1)}
              </div>
            `,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          })

          const marker = L.marker(house.coordinates, { icon: houseIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 220px;">
                <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #1f2937;">${house.address}</h3>
                <div style="margin: 4px 0; font-size: 12px; color: #6b7280;"><strong>Type:</strong> ${house.type}</div>
                <div style="margin: 4px 0; font-size: 12px; color: #6b7280;"><strong>Quartier:</strong> ${house.quartier}</div>
                <div style="margin: 8px 0 4px 0; font-size: 16px; color: #1f2937; font-weight: 700;"><strong>Consommation:</strong> ${house.usage.toFixed(1)} kWh/jour</div>
                <div style="margin: 4px 0; font-size: 12px; color: #6b7280;"><strong>Résidents:</strong> ${house.residents}</div>
                <div style="margin: 4px 0; font-size: 12px; color: #6b7280;"><strong>Par personne:</strong> ${(house.usage / house.residents).toFixed(1)} kWh/jour</div>
              </div>
            `)
            .on("click", () => {
              onItemSelect(house)
            })

          // Highlight selected house
          if (selectedItem && selectedItem.id === house.id) {
            marker.setIcon(
              L.divIcon({
                className: "house-marker",
                html: `
                <div style="
                  width: ${size + 4}px;
                  height: ${size + 4}px;
                  background: ${color};
                  border: 4px solid #FFD700;
                  border-radius: 50%;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: ${Math.max(7, size * 0.35)}px;
                  font-weight: 700;
                  color: white;
                  text-shadow: 1px 1px 1px rgba(0,0,0,0.8);
                  cursor: pointer;
                  transform: scale(1.1);
                  font-family: system-ui, -apple-system, sans-serif;
                ">
                  ${house.usage.toFixed(1)}
                </div>
              `,
                iconSize: [size + 4, size + 4],
                iconAnchor: [(size + 4) / 2, (size + 4) / 2],
              }),
            )
            marker.openPopup()
          }

          layersRef.current.push({ marker, house })
        })
      } else {
        // Add zone polygons
        zoneData.forEach((zone) => {
          const color = getZoneUsageColor(zone.usage)
          const opacity = getZoneUsageOpacity(zone.usage)

          // Create zone polygon
          const polygon = L.rectangle(zone.bounds, {
            color: color,
            weight: 2,
            opacity: 0.8,
            fillColor: color,
            fillOpacity: showLayer ? opacity : 0,
            className: "zone-area",
          })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 240px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">${zone.name}</h3>
                <div style="margin: 4px 0; font-size: 13px; color: #6b7280;"><strong>District:</strong> ${zone.district}</div>
                <div style="margin: 4px 0; font-size: 13px; color: #6b7280;"><strong>Type:</strong> ${zone.type}</div>
                <div style="margin: 8px 0 4px 0; font-size: 16px; color: #1f2937; font-weight: 700;"><strong>Consommation:</strong> ${zone.usage.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kWh/jour</div>
                <div style="margin: 4px 0; font-size: 13px; color: #6b7280;"><strong>Superficie:</strong> ${zone.area} km²</div>
                <div style="margin: 4px 0; font-size: 13px; color: #6b7280;"><strong>Densité:</strong> ${(zone.usage / zone.area).toFixed(1)} kWh/km²</div>
                <div style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280; font-style: italic;">${zone.description}</div>
              </div>
            `)
            .on("click", () => {
              onItemSelect(zone)
            })

          // Create center marker for zone
          const centerMarker = L.marker(zone.coordinates, {
            icon: L.divIcon({
              className: "zone-center-marker",
              html: `
                <div style="
                  width: 28px;
                  height: 20px;
                  background: ${color};
                  border: 2px solid white;
                  border-radius: 4px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 9px;
                  font-weight: 700;
                  color: white;
                  text-shadow: 1px 1px 1px rgba(0,0,0,0.8);
                  cursor: pointer;
                  font-family: system-ui, -apple-system, sans-serif;
                ">
                  ${(zone.usage / 1000).toFixed(1)}k
                </div>
              `,
              iconSize: [28, 20],
              iconAnchor: [14, 10],
            }),
          })
            .addTo(mapInstanceRef.current)
            .on("click", () => {
              onItemSelect(zone)
              polygon.openPopup()
            })

          // Highlight selected zone
          if (selectedItem && selectedItem.id === zone.id) {
            polygon.setStyle({
              weight: 4,
              opacity: 1,
              color: "#FFD700",
            })
            // Fit bounds to selected zone
            mapInstanceRef.current.fitBounds(zone.bounds, { padding: [20, 20] })
            polygon.openPopup()
          }

          layersRef.current.push({ polygon, marker: centerMarker, zone })
        })
      }
    })
  }, [viewMode, houseData, zoneData, selectedItem, showLayer, onItemSelect])

  return <div ref={mapRef} className="w-full h-full" />
}
