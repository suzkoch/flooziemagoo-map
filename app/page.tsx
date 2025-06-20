// app/page.tsx
"use client"

import { useEffect, useState } from "react"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, ExternalLink } from "lucide-react"

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

interface Country {
  id: string
  name: string
  hasRecipe: boolean
  votes: number
  recipeTitle?: string
  flag: string
  cuisine?: string
  blogUrl?: string
}

const countryMeta: Record<string, { id: string; cuisine: string; flag: string }> = {
  Jamaica: { id: "JM", cuisine: "Caribbean", flag: "🇯🇲" },
  Samoa: { id: "WS", cuisine: "Pacific", flag: "🇼🇸" },
  France: { id: "FR", cuisine: "European", flag: "🇫🇷" },
  Brazil: { id: "BR", cuisine: "South American", flag: "🇧🇷" },
  // Add more as needed
}

function useCountriesFromBlog(): Country[] {
  const [countries, setCountries] = useState<Country[]>([])

  useEffect(() => {
    async function fetchPosts() {
      const res = await fetch("https://public-api.wordpress.com/wp/v2/sites/flooziemagoo.wordpress.com/posts")
      const posts = await res.json()

      const parsed = posts.map((post: any) => {
        const title = post.title.rendered;
        const link = post.link;

        // Remove emoji, split on "|"
        const parts = title.replace(/^[^\w\s]*/, "").split("|");

        if (parts.length === 2) {
          const countryName = parts[0].trim();
          const recipeTitle = parts[1].trim();

          const meta = countryMeta[countryName];
          if (meta) {
            return {
              id: meta.id,
              name: countryName,
              hasRecipe: true,
              votes: 0,
              recipeTitle,
              flag: meta.flag,
              cuisine: meta.cuisine,
              blogUrl: link,
            } as Country;
          }
        }

        return null;
      }).filter(Boolean);

      setCountries(parsed as Country[]);
    }

    fetchPosts()
  }, [])

  return countries
}

export default function CompleteWorldMap() {
  const dynamicCountries = useCountriesFromBlog()
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [countryVotes, setCountryVotes] = useState<Record<string, number>>({})

  const getCountryColor = (countryId: string) => {
    const country = dynamicCountries.find((c) => c.id === countryId)
    if (!country) return "#E5E7EB"
    return country.hasRecipe ? "#F97316" : "#9CA3AF"
  }

  const handleCountryClick = (geo: any) => {
    const countryId = geo.properties.ISO_A2
    const country = dynamicCountries.find((c) => c.id === countryId)
    if (!country) return
    if (country.hasRecipe && country.blogUrl) window.open(country.blogUrl, "_blank")
    else setSelectedCountry(country)
  }

  const handleVote = (countryId: string) => {
    setCountryVotes((prev) => ({ ...prev, [countryId]: (prev[countryId] || 0) + 1 }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Flooziemagoo</h1>
              <p className="text-gray-600 mt-1">Making one vegan recipe from every country in the world</p>
              <Badge variant="secondary" className="bg-green-100 text-green-800 mt-2">
                {dynamicCountries.length}/195 Countries Completed
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                Interactive World Map - All 195 Countries
              </h2>
              <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg p-4 min-h-[600px]">
                <ComposableMap projectionConfig={{ scale: 147 }} style={{ width: "100%", height: "600px" }}>
                  <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={getCountryColor(geo.properties.ISO_A2)}
                          stroke="#FFFFFF"
                          strokeWidth={0.5}
                          style={{ default: { outline: "none" }, hover: { fill: getCountryColor(geo.properties.ISO_A2), cursor: "pointer" }, pressed: { outline: "none" } }}
                          onClick={() => handleCountryClick(geo)}
                        >
                          <title>{geo.properties.NAME}</title>
                        </Geography>
                      ))
                    }
                  </Geographies>
                </ComposableMap>
              </div>
              <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span className="text-sm text-orange-800 font-medium">Recipe Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-400 rounded"></div>
                    <span className="text-sm text-gray-600 font-medium">Coming Soon</span>
                  </div>
                </div>
                <p className="text-sm text-orange-800">
                  <strong>✅ Complete World Map:</strong> Orange countries have completed recipes! Click them to view the blog post. Gray countries are coming soon - click to vote!
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {selectedCountry && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{selectedCountry.flag}</span>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedCountry.name}</h3>
                    <p className="text-gray-600">{selectedCountry.cuisine} Cuisine</p>
                  </div>
                </div>
                {selectedCountry.hasRecipe ? (
                  <>
                    <h4 className="font-medium text-green-800 mb-2">Recipe Available!</h4>
                    <p className="text-gray-700 mb-4">{selectedCountry.recipeTitle}</p>
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => selectedCountry.blogUrl && window.open(selectedCountry.blogUrl, "_blank")}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Recipe
                    </Button>
                  </>
                ) : (
                  <>
                    <h4 className="font-medium text-gray-800 mb-2">Coming Soon!</h4>
                    <p className="text-gray-600 mb-4">This recipe hasn't been created yet. Vote to help prioritize it!</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">Current votes:</span>
                      <Badge variant="outline">{countryVotes[selectedCountry.id] || 0}</Badge>
                    </div>
                    <Button onClick={() => handleVote(selectedCountry.id)} variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50">
                      <Heart className="w-4 h-4 mr-2" />
                      Vote for This Country
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>