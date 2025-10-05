"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Search, Layers, Activity, Eye, EyeOff, Home, Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

// Dynamically import the map component to avoid SSR issues
const BrazzavilleMap = dynamic(() => import("@/components/brazzaville-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-700 text-lg font-medium">Loading Brazzaville Map...</p>
      </div>
    </div>
  ),
})

export interface QuartierData {
  id: string
  name: string
  coordinates: [number, number]
  bounds: [[number, number], [number, number]]
  usage: number // kWh per day
  population: number
  type: "residential" | "commercial" | "industrial" | "mixed"
  district: string
}

export interface HouseData {
  id: string
  address: string
  coordinates: [number, number]
  usage: number // kWh per day
  residents: number
  type: "apartment" | "house" | "villa"
  quartier: string
  district: string
}

export interface ZoneData {
  id: string
  name: string
  coordinates: [number, number]
  bounds: [[number, number], [number, number]]
  usage: number // kWh per day
  area: number // km²
  type: "residential" | "commercial" | "industrial" | "mixed" | "administrative"
  district: string
  description: string
}

export type ViewMode = "houses" | "zones"

export interface ElectricityData {
  id: string
  name: string
  coordinates: [number, number]
  usage: number
  type: string
  population: number
}

// Mock data for Brazzaville houses (200 houses)
const generateHouseData = (): HouseData[] => {
  const houses: HouseData[] = []
  const quartiers = [
    {
      name: "Centre-ville",
      district: "Makélékélé",
      bounds: [
        [-4.2734, 15.2329],
        [-4.2534, 15.2529],
      ],
    },
    {
      name: "Poto-Poto",
      district: "Poto-Poto",
      bounds: [
        [-4.2634, 15.2529],
        [-4.2434, 15.2729],
      ],
    },
    {
      name: "Bacongo",
      district: "Bacongo",
      bounds: [
        [-4.2934, 15.2229],
        [-4.2734, 15.2429],
      ],
    },
    {
      name: "Moungali",
      district: "Moungali",
      bounds: [
        [-4.2534, 15.2629],
        [-4.2334, 15.2829],
      ],
    },
    {
      name: "Ouenzé",
      district: "Ouenzé",
      bounds: [
        [-4.2334, 15.2729],
        [-4.2134, 15.2929],
      ],
    },
    {
      name: "Talangaï",
      district: "Talangaï",
      bounds: [
        [-4.2134, 15.2829],
        [-4.1934, 15.3029],
      ],
    },
    {
      name: "Mfilou",
      district: "Mfilou",
      bounds: [
        [-4.3134, 15.2029],
        [-4.2934, 15.2229],
      ],
    },
    {
      name: "Madibou",
      district: "Madibou",
      bounds: [
        [-4.2834, 15.2729],
        [-4.2634, 15.2929],
      ],
    },
  ]

  const houseTypes: ("apartment" | "house" | "villa")[] = ["apartment", "house", "villa"]
  const streets = ["Rue", "Avenue", "Boulevard", "Impasse", "Place"]

  for (let i = 0; i < 200; i++) {
    const quartier = quartiers[Math.floor(Math.random() * quartiers.length)]
    const [[minLat, minLng], [maxLat, maxLng]] = quartier.bounds

    // Generate random coordinates within quartier bounds
    const lat = minLat + Math.random() * (maxLat - minLat)
    const lng = minLng + Math.random() * (maxLng - minLng)

    const houseType = houseTypes[Math.floor(Math.random() * houseTypes.length)]
    const streetName = streets[Math.floor(Math.random() * streets.length)]
    const streetNumber = Math.floor(Math.random() * 200) + 1

    // Usage varies by house type with decimal precision
    let baseUsage = 0
    let residents = 0

    switch (houseType) {
      case "apartment":
        baseUsage = 15 + Math.random() * 35 // 15-50 kWh
        residents = 2 + Math.floor(Math.random() * 4) // 2-5 residents
        break
      case "house":
        baseUsage = 25 + Math.random() * 45 // 25-70 kWh
        residents = 3 + Math.floor(Math.random() * 5) // 3-7 residents
        break
      case "villa":
        baseUsage = 50 + Math.random() * 80 // 50-130 kWh
        residents = 4 + Math.floor(Math.random() * 6) // 4-9 residents
        break
    }

    houses.push({
      id: `house-${i}`,
      address: `${streetNumber} ${streetName} ${quartier.name}`,
      coordinates: [lat, lng],
      usage: Math.round(baseUsage * 10) / 10, // One decimal place
      residents,
      type: houseType,
      quartier: quartier.name,
      district: quartier.district,
    })
  }

  return houses
}

// Mock data for zones (larger areas with different consumption patterns)
const generateZoneData = (): ZoneData[] => {
  const zones = [
    {
      name: "Zone Résidentielle Nord",
      coords: [-4.24, 15.27] as [number, number],
      bounds: [
        [-4.26, 15.25],
        [-4.22, 15.29],
      ] as [[number, number], [number, number]],
      type: "residential" as const,
      district: "Moungali",
      description: "Zone résidentielle dense avec habitations familiales",
      area: 2.5,
    },
    {
      name: "District Commercial Central",
      coords: [-4.2634, 15.2429] as [number, number],
      bounds: [
        [-4.2734, 15.2329],
        [-4.2534, 15.2529],
      ] as [[number, number], [number, number]],
      type: "commercial" as const,
      district: "Makélékélé",
      description: "Centre d'affaires principal avec bureaux et commerces",
      area: 1.8,
    },
    {
      name: "Zone Industrielle Sud",
      coords: [-4.2934, 15.2329] as [number, number],
      bounds: [
        [-4.3134, 15.2129],
        [-4.2734, 15.2529],
      ] as [[number, number], [number, number]],
      type: "industrial" as const,
      district: "Makélékélé",
      description: "Zone industrielle avec usines et entrepôts",
      area: 4.2,
    },
    {
      name: "Quartier Mixte Poto-Poto",
      coords: [-4.2534, 15.2629] as [number, number],
      bounds: [
        [-4.2634, 15.2529],
        [-4.2434, 15.2729],
      ] as [[number, number], [number, number]],
      type: "mixed" as const,
      district: "Poto-Poto",
      description: "Zone mixte résidentielle et commerciale",
      area: 1.9,
    },
    {
      name: "Zone Administrative",
      coords: [-4.2734, 15.2529] as [number, number],
      bounds: [
        [-4.2834, 15.2429],
        [-4.2634, 15.2629],
      ] as [[number, number], [number, number]],
      type: "administrative" as const,
      district: "Centre",
      description: "Bâtiments gouvernementaux et services publics",
      area: 1.2,
    },
    {
      name: "Résidentiel Bacongo",
      coords: [-4.2834, 15.2329] as [number, number],
      bounds: [
        [-4.2934, 15.2229],
        [-4.2734, 15.2429],
      ] as [[number, number], [number, number]],
      type: "residential" as const,
      district: "Bacongo",
      description: "Quartier résidentiel traditionnel",
      area: 2.1,
    },
    {
      name: "Zone Commerciale Ouenzé",
      coords: [-4.2234, 15.2829] as [number, number],
      bounds: [
        [-4.2334, 15.2729],
        [-4.2134, 15.2929],
      ] as [[number, number], [number, number]],
      type: "commercial" as const,
      district: "Ouenzé",
      description: "Centre commercial et marché principal",
      area: 1.6,
    },
    {
      name: "Résidentiel Talangaï",
      coords: [-4.2034, 15.2929] as [number, number],
      bounds: [
        [-4.2134, 15.2829],
        [-4.1934, 15.3029],
      ] as [[number, number], [number, number]],
      type: "residential" as const,
      district: "Talangaï",
      description: "Zone résidentielle moderne",
      area: 2.8,
    },
    {
      name: "Zone Mixte Madibou",
      coords: [-4.2734, 15.2829] as [number, number],
      bounds: [
        [-4.2834, 15.2729],
        [-4.2634, 15.2929],
      ] as [[number, number], [number, number]],
      type: "mixed" as const,
      district: "Madibou",
      description: "Zone résidentielle et commerciale",
      area: 1.7,
    },
    {
      name: "Zone Industrielle Mfilou",
      coords: [-4.3034, 15.2129] as [number, number],
      bounds: [
        [-4.3234, 15.1929],
        [-4.2834, 15.2329],
      ] as [[number, number], [number, number]],
      type: "industrial" as const,
      district: "Mfilou",
      description: "Zone industrielle secondaire",
      area: 3.5,
    },
  ]

  return zones.map((zone, index) => {
    // Usage varies by zone type and area with decimal precision
    let baseUsage = 0
    switch (zone.type) {
      case "residential":
        baseUsage = 800 + Math.random() * 1200 // 800-2000 kWh
        break
      case "commercial":
        baseUsage = 1500 + Math.random() * 2500 // 1500-4000 kWh
        break
      case "industrial":
        baseUsage = 3000 + Math.random() * 4000 // 3000-7000 kWh
        break
      case "mixed":
        baseUsage = 1000 + Math.random() * 1800 // 1000-2800 kWh
        break
      case "administrative":
        baseUsage = 600 + Math.random() * 900 // 600-1500 kWh
        break
    }

    return {
      id: `zone-${index}`,
      name: zone.name,
      coordinates: zone.coords,
      bounds: zone.bounds,
      usage: Math.round(baseUsage * 10) / 10, // One decimal place
      area: zone.area,
      type: zone.type,
      district: zone.district,
      description: zone.description,
    }
  })
}

export default function Page() {
  const [viewMode, setViewMode] = useState<ViewMode>("zones")
  const [houseData, setHouseData] = useState<HouseData[]>([])
  const [zoneData, setZoneData] = useState<ZoneData[]>([])
  const [selectedHouse, setSelectedHouse] = useState<HouseData | null>(null)
  const [selectedZone, setSelectedZone] = useState<ZoneData | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showLayer, setShowLayer] = useState(true)
  const [isRealTime, setIsRealTime] = useState(false)

  useEffect(() => {
    setHouseData(generateHouseData())
    setZoneData(generateZoneData())
  }, [])

  useEffect(() => {
    if (!isRealTime) return

    const interval = setInterval(() => {
      if (viewMode === "houses") {
        setHouseData((prev) =>
          prev.map((house) => ({
            ...house,
            usage: Math.round(Math.max(5, house.usage + (Math.random() - 0.5) * 10) * 10) / 10,
          })),
        )
      } else {
        setZoneData((prev) =>
          prev.map((zone) => ({
            ...zone,
            usage: Math.round(Math.max(200, zone.usage + (Math.random() - 0.5) * 300) * 10) / 10,
          })),
        )
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [isRealTime, viewMode])

  const currentData = viewMode === "houses" ? houseData : zoneData
  const filteredData = currentData.filter((item) => {
    const searchFields =
      viewMode === "houses"
        ? [item.address, (item as HouseData).quartier, (item as HouseData).district]
        : [(item as ZoneData).name, (item as ZoneData).district, (item as ZoneData).description]

    return searchFields.some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()))
  })

  const handleItemSelect = (item: HouseData | ZoneData | null) => {
    if (viewMode === "houses") {
      setSelectedHouse(item as HouseData)
      setSelectedZone(null)
    } else {
      setSelectedZone(item as ZoneData)
      setSelectedHouse(null)
    }
  }

  const selectedItem = viewMode === "houses" ? selectedHouse : selectedZone

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Full-screen Map */}
      <BrazzavilleMap
        viewMode={viewMode}
        houseData={houseData}
        zoneData={zoneData}
        onItemSelect={handleItemSelect}
        selectedItem={selectedItem}
        showLayer={showLayer}
      />

      {/* Search Bar - Top Left */}
      <div className="absolute top-4 left-4 z-[1000]">
        <Card className="w-72 shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={viewMode === "houses" ? "Rechercher une adresse..." : "Rechercher une zone..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-0 bg-gray-50 focus:bg-white transition-colors text-sm"
              />
            </div>
            {searchTerm && (
              <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                {filteredData.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className="p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                    onClick={() => {
                      handleItemSelect(item)
                      setSearchTerm("")
                    }}
                  >
                    {viewMode === "houses" ? (
                      <div>
                        <div className="font-medium text-xs">{(item as HouseData).address}</div>
                        <div className="text-xs text-gray-500">{(item as HouseData).quartier}</div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium text-xs">{(item as ZoneData).name}</div>
                        <div className="text-xs text-gray-500">{(item as ZoneData).district}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Consolidated Controls & Legend - Top Right */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-3 space-y-3">
            {/* Mode & Control Buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === "houses" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("houses")}
                className="h-7 px-2 text-xs border"
              >
                <Home className="h-3 w-3 mr-1" />
                Maisons
              </Button>
              <Button
                variant={viewMode === "zones" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("zones")}
                className="h-7 px-2 text-xs border"
              >
                <Building2 className="h-3 w-3 mr-1" />
                Zones
              </Button>
              <Button
                variant={showLayer ? "default" : "outline"}
                size="sm"
                onClick={() => setShowLayer(!showLayer)}
                className="h-7 px-2 text-xs border"
              >
                {showLayer ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
            </div>

            {/* Real-time Toggle */}
            <div className="flex items-center gap-1">
              <Button
                variant={isRealTime ? "default" : "outline"}
                size="sm"
                onClick={() => setIsRealTime(!isRealTime)}
                className="h-7 px-2 text-xs border flex-1"
              >
                <Activity className="h-3 w-3 mr-1" />
                {isRealTime ? "Temps Réel" : "Statique"}
              </Button>
            </div>

            {/* Legend */}
            <div className="border-t pt-2">
              <div className="flex items-center gap-1 mb-2">
                <Layers className="h-3 w-3" />
                <span className="text-xs font-medium">
                  {viewMode === "houses" ? "Consommation Maisons" : "Consommation Zones"}
                </span>
              </div>
              <div className="space-y-1">
                {viewMode === "houses" ? (
                  <>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Faible (0-30 kWh)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Modéré (30-60 kWh)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Élevé (60-90 kWh)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Très Élevé (90+ kWh)</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Faible (0-1500 kWh)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Modéré (1500-3000 kWh)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Élevé (3000-5000 kWh)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Très Élevé (5000+ kWh)</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Item Details - Only show when item is selected */}
      {selectedItem && (
        <div className="absolute bottom-4 right-4 z-[1000]">
          <Card className="w-80 shadow-lg border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 font-semibold">
                {viewMode === "houses" ? (
                  <Home className="h-4 w-4 text-blue-500" />
                ) : (
                  <Building2 className="h-4 w-4 text-blue-500" />
                )}
                <span className="truncate">
                  {viewMode === "houses" ? (selectedItem as HouseData).address : (selectedItem as ZoneData).name}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {viewMode === "houses" ? (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize text-xs">
                      {(selectedItem as HouseData).type}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {(selectedItem as HouseData).quartier}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Consommation:</span>
                      <span className="font-bold text-xl text-blue-600">
                        {selectedItem.usage.toFixed(1)} <span className="text-sm font-normal">kWh/jour</span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Résidents:</span>
                      <span className="font-semibold text-lg">{(selectedItem as HouseData).residents}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Par personne:</span>
                      <span className="font-semibold text-lg text-green-600">
                        {(selectedItem.usage / (selectedItem as HouseData).residents).toFixed(1)}{" "}
                        <span className="text-sm font-normal">kWh/jour</span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">District:</span>
                      <span className="font-medium text-sm">{(selectedItem as HouseData).district}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize text-xs">
                      {(selectedItem as ZoneData).type}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {(selectedItem as ZoneData).district}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Consommation:</span>
                      <span className="font-bold text-xl text-blue-600">
                        {selectedItem.usage.toLocaleString(undefined, {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}{" "}
                        <span className="text-sm font-normal">kWh/jour</span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Superficie:</span>
                      <span className="font-semibold text-lg">
                        {(selectedItem as ZoneData).area} <span className="text-sm font-normal">km²</span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Densité:</span>
                      <span className="font-semibold text-lg text-green-600">
                        {(selectedItem.usage / (selectedItem as ZoneData).area).toFixed(1)}{" "}
                        <span className="text-sm font-normal">kWh/km²</span>
                      </span>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-600 leading-relaxed">{(selectedItem as ZoneData).description}</p>
                    </div>
                  </div>
                </>
              )}

              <div className="pt-2 border-t">
                <div className="text-xs text-gray-500 font-mono">
                  {selectedItem.coordinates[0].toFixed(4)}, {selectedItem.coordinates[1].toFixed(4)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
