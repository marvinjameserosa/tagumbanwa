"use client"

import { useEffect, useRef } from "react"
import type { ElectricityData } from "@/app/page"

interface ElectricityMapProps {
  data: ElectricityData[]
  onAreaSelect: (area: ElectricityData | null) => void
  selectedArea: ElectricityData | null
}

// Color mapping function
const getUsageColor = (usage: number): string => {
  if (usage < 300) return "#3B82F6" // Blue - Low
  if (usage < 600) return "#10B981" // Green - Medium
  if (usage < 900) return "#F59E0B" // Yellow - High
  return "#EF4444" // Red - Very High
}

const getUsageIntensity = (usage: number): number => {
  return Math.min(usage / 1000, 1) // Normalize to 0-1
}

export default function ElectricityMap({ data, onAreaSelect, selectedArea }: ElectricityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return

    // Dynamically import Leaflet
    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return

      // Initialize map
      mapInstanceRef.current = L.map(mapRef.current).setView([40.7589, -73.9851], 12)

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstanceRef.current)

      // Custom icon function
      const createCustomIcon = (color: string, usage: number) => {
        const intensity = getUsageIntensity(usage)
        const size = 20 + intensity * 20 // Size based on usage

        return L.divIcon({
          className: "custom-marker",
          html: `
            <div style="
              width: ${size}px;
              height: ${size}px;
              background-color: ${color};
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              font-weight: bold;
              color: white;
              text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
            ">
              ${Math.round(usage)}
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        })
      }

      // Add markers for each area
      data.forEach((area) => {
        const color = getUsageColor(area.usage)
        const icon = createCustomIcon(color, area.usage)

        const marker = L.marker(area.coordinates, { icon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="font-family: system-ui, -apple-system, sans-serif;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${area.name}</h3>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Usage:</strong> ${area.usage.toLocaleString()} kWh</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Type:</strong> ${area.type}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Population:</strong> ${area.population.toLocaleString()}</p>
            </div>
          `)
          .on("click", () => {
            onAreaSelect(area)
          })

        markersRef.current.push(marker)
      })
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
      markersRef.current = []
    }
  }, [])

  // Update markers when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === "undefined") return

    import("leaflet").then((L) => {
      // Clear existing markers
      markersRef.current.forEach((marker) => {
        mapInstanceRef.current.removeLayer(marker)
      })
      markersRef.current = []

      // Add updated markers
      data.forEach((area) => {
        const color = getUsageColor(area.usage)
        const createCustomIcon = (color: string, usage: number) => {
          const intensity = getUsageIntensity(usage)
          const size = 20 + intensity * 20

          return L.divIcon({
            className: "custom-marker",
            html: `
              <div style="
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: bold;
                color: white;
                text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
                transition: all 0.3s ease;
              ">
                ${Math.round(area.usage)}
              </div>
            `,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          })
        }

        const icon = createCustomIcon(color, area.usage)
        const isSelected = selectedArea?.id === area.id

        const marker = L.marker(area.coordinates, { icon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="font-family: system-ui, -apple-system, sans-serif;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${area.name}</h3>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Usage:</strong> ${area.usage.toLocaleString()} kWh</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Type:</strong> ${area.type}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Population:</strong> ${area.population.toLocaleString()}</p>
            </div>
          `)
          .on("click", () => {
            onAreaSelect(area)
          })

        if (isSelected) {
          marker.openPopup()
        }

        markersRef.current.push(marker)
      })
    })
  }, [data, selectedArea, onAreaSelect])

  return <div ref={mapRef} className="w-full h-[600px] rounded-lg" style={{ minHeight: "400px" }} />
}
