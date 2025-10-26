import { MoreHorizontal, Bookmark, Smile, Share } from "lucide-react";

export default function SocialPost() {
  return (
    <div className="max-w-sm mx-auto bg-white rounded-3xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
            <span className="text-white text-sm font-medium">TI</span>
          </div>
          <span className="font-medium text-gray-900">tame_impala508</span>
        </div>
        <div className="flex items-center gap-2">
          <MoreHorizontal className="w-5 h-5 text-gray-600" />
          <Bookmark className="w-5 h-5 text-gray-600" />
          <Smile className="w-5 h-5 text-gray-600" />
        </div>
      </div>

      {/* Main Image/Content */}
      <div className="relative">
        <div className="aspect-square bg-gradient-to-br from-purple-600 via-purple-800 to-indigo-900 relative overflow-hidden">
          {/* Psychedelic wave pattern background */}
          <div className="absolute inset-0 opacity-80">
            <div className="w-full h-full" style={{
              background: `
                repeating-linear-gradient(
                  45deg,
                  transparent 0px,
                  rgba(255,255,255,0.1) 1px,
                  transparent 2px,
                  rgba(255,255,255,0.05) 4px
                ),
                repeating-linear-gradient(
                  -45deg,
                  rgba(147,51,234,0.8) 0px,
                  rgba(168,85,247,0.8) 10px,
                  rgba(192,132,252,0.8) 20px,
                  rgba(147,51,234,0.8) 30px
                )
              `
            }}></div>
          </div>

          {/* Top labels */}
          <div className="absolute top-4 left-4 text-red-500 text-xs font-bold tracking-wider">
            TAME IMPALA
          </div>
          <div className="absolute top-4 right-4 text-orange-400 text-xs font-bold tracking-wider">
            CURRENTS
          </div>

          {/* Red diagonal line */}
          <div className="absolute top-0 left-0 w-1 h-32 bg-red-500 transform rotate-45 origin-top-left"></div>

          {/* Person silhouette placeholder */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="w-24 h-32 bg-black bg-opacity-60 rounded-lg flex items-center justify-center">
              <div className="w-12 h-16 bg-gray-300 rounded"></div>
            </div>
          </div>

          {/* Orange accent */}
          <div className="absolute bottom-6 right-8 w-3 h-3 bg-orange-400 rounded-full"></div>
        </div>
      </div>

      {/* Caption */}
      <div className="p-4">
        <p className="text-gray-900 text-sm">
          You feel lonely, I feel lonely, we aren't the same
        </p>
      </div>

      {/* Bottom action */}
      <div className="px-4 pb-4 flex justify-end">
        <Share className="w-5 h-5 text-gray-600" />
      </div>
    </div>
  );
}