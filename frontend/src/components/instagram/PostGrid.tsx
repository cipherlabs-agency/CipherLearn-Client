import { useState } from "react"
import { motion } from "framer-motion"
import { Image, Film, LayoutGrid, Heart, MessageCircle, RefreshCw, List, Grid } from "lucide-react"
import { useGetInstagramMediaQuery } from "@/redux/api/instagramApi"
import type { IgMedia } from "@/redux/api/instagramApi"

interface PostGridProps {
    onSelectPost: (post: IgMedia) => void
}

export function PostGrid({ onSelectPost }: PostGridProps) {
    const { data, isLoading, isError, refetch, isFetching } = useGetInstagramMediaQuery({})
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array.from({ length: 15 }).map((_, i) => (
                    <div
                        key={i}
                        className="aspect-square animate-pulse rounded-xl bg-muted/60"
                    />
                ))}
            </div>
        )
    }

    if (isError || !data?.data?.length) {
        return (
            <div className="card-vercel flex flex-col items-center justify-center py-20 text-center w-full">
                <LayoutGrid className="mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-bold text-foreground tracking-tight">
                    No posts found
                </h3>
                <p className="mt-2 text-sm text-muted-vercel max-w-sm">
                    Post some content on Instagram first, then come back here to set up DM automations.
                </p>
                <div className="mt-6">
                    <button onClick={refetch} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                        <RefreshCw className="h-4 w-4" /> Refresh Posts
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="relative">
            {/* Controls Row */}
            <div className="absolute right-0 -top-12 z-10 flex items-center justify-end gap-3 w-auto">
                <div className="flex bg-muted p-1 rounded-md border border-border">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`p-1 rounded-sm transition-colors ${viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <Grid className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`p-1 rounded-sm transition-colors ${viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>

                <button 
                    onClick={refetch} 
                    disabled={isFetching}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-1.5 rounded-md border border-border hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} /> 
                    {isFetching ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {viewMode === "grid" ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {data.data.map((post, i) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.02, duration: 0.3 }}
                            onClick={() => onSelectPost(post)}
                            className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-muted border border-border shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-primary/50"
                        >
                            {/* Thumbnail */}
                            {(post.media_url || post.thumbnail_url) ? (
                                <img
                                    src={post.thumbnail_url || post.media_url}
                                    alt={post.caption?.slice(0, 50) || "Instagram post"}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-primary/5">
                                    <Image className="h-8 w-8 text-primary/40" />
                                </div>
                            )}

                            {/* Media type badge */}
                            <div className="absolute left-2.5 top-2.5">
                                {post.media_type === "VIDEO" ? (
                                    <div className="rounded bg-black/70 px-1.5 py-1 text-white backdrop-blur-md shadow-sm">
                                        <Film className="h-3.5 w-3.5" />
                                    </div>
                                ) : post.media_type === "CAROUSEL_ALBUM" ? (
                                    <div className="rounded bg-black/70 px-1.5 py-1 text-white backdrop-blur-md shadow-sm">
                                        <LayoutGrid className="h-3.5 w-3.5" />
                                    </div>
                                ) : null}
                            </div>

                            {/* Hover Overlay Stats */}
                            <div className="absolute inset-0 flex items-center justify-center gap-5 bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100 backdrop-blur-[2px]">
                                <div className="flex flex-col items-center gap-1 text-white">
                                    <Heart className="h-6 w-6 fill-white" />
                                    <span className="text-sm font-bold">{post.like_count ?? 0}</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 text-white">
                                    <MessageCircle className="h-6 w-6 fill-white" />
                                    <span className="text-sm font-bold">{post.comments_count ?? 0}</span>
                                </div>
                            </div>

                            {/* Caption Strip */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-8 pointer-events-none">
                                <p className="line-clamp-2 text-[11px] font-medium text-white/90 leading-tight">
                                    {post.caption || "No caption"}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="card-vercel overflow-hidden p-0 border border-border">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                            <tr>
                                <th className="px-4 py-3 font-medium">Post</th>
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3 font-medium text-right">Likes</th>
                                <th className="px-4 py-3 font-medium text-right">Comments</th>
                                <th className="px-4 py-3 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.data.map((post) => (
                                <tr 
                                    key={post.id} 
                                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                                    onClick={() => onSelectPost(post)}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3 max-w-[300px]">
                                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-muted border border-border">
                                                {(post.media_url || post.thumbnail_url) ? (
                                                    <img
                                                        src={post.thumbnail_url || post.media_url}
                                                        alt="thumbnail"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <Image className="h-full w-full p-2 text-muted-foreground" />
                                                )}
                                            </div>
                                            <p className="truncate text-sm font-medium text-foreground">
                                                {post.caption || "No caption"}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            {post.media_type === "VIDEO" && <Film className="h-3.5 w-3.5" />}
                                            {post.media_type === "CAROUSEL_ALBUM" && <LayoutGrid className="h-3.5 w-3.5" />}
                                            {post.media_type === "IMAGE" && <Image className="h-3.5 w-3.5" />}
                                            <span className="text-xs">{post.media_type || "UNKNOWN"}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                        {post.like_count?.toLocaleString() ?? 0}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                        {post.comments_count?.toLocaleString() ?? 0}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">Select &rarr;</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
