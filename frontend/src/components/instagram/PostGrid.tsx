"use client"

import { motion } from "framer-motion"
import { Image, Film, LayoutGrid, Heart, MessageCircle, ExternalLink } from "lucide-react"
import { useGetInstagramMediaQuery } from "@/redux/api/instagramApi"
import type { IgMedia } from "@/redux/api/instagramApi"

interface PostGridProps {
    onSelectPost: (post: IgMedia) => void
}

export function PostGrid({ onSelectPost }: PostGridProps) {
    const { data, isLoading, isError } = useGetInstagramMediaQuery({})

    if (isLoading) {
        return (
            <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div
                        key={i}
                        className="aspect-square animate-pulse rounded-xl bg-[var(--color-warm-100)]"
                    />
                ))}
            </div>
        )
    }

    if (isError || !data?.data?.length) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <LayoutGrid className="mb-3 h-12 w-12 text-[var(--color-warm-300)]" />
                <h3 className="text-lg font-semibold text-[var(--color-warm-700)]">
                    No posts found
                </h3>
                <p className="mt-1 text-sm text-[var(--color-warm-400)]">
                    Post some content on Instagram first, then come back to set up automations.
                </p>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--color-warm-900)]">
                    Your Posts & Reels
                </h2>
                <p className="text-sm text-[var(--color-warm-400)]">
                    Click any post to set up DM automation
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {data.data.map((post, i) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => onSelectPost(post)}
                        className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-[var(--color-warm-200)] bg-[var(--color-warm-50)]"
                    >
                        {/* Thumbnail */}
                        {(post.media_url || post.thumbnail_url) ? (
                            <img
                                src={post.thumbnail_url || post.media_url}
                                alt={post.caption?.slice(0, 50) || "Post"}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                                <Image className="h-10 w-10 text-purple-300" />
                            </div>
                        )}

                        {/* Media type badge */}
                        <div className="absolute left-2 top-2">
                            {post.media_type === "VIDEO" ? (
                                <div className="rounded-md bg-black/60 px-1.5 py-0.5 text-white backdrop-blur-sm">
                                    <Film className="h-3.5 w-3.5" />
                                </div>
                            ) : post.media_type === "CAROUSEL_ALBUM" ? (
                                <div className="rounded-md bg-black/60 px-1.5 py-0.5 text-white backdrop-blur-sm">
                                    <LayoutGrid className="h-3.5 w-3.5" />
                                </div>
                            ) : null}
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <div className="flex items-center gap-1 text-sm font-semibold text-white">
                                <Heart className="h-4 w-4" />
                                {post.like_count ?? 0}
                            </div>
                            <div className="flex items-center gap-1 text-sm font-semibold text-white">
                                <MessageCircle className="h-4 w-4" />
                                {post.comments_count ?? 0}
                            </div>
                        </div>

                        {/* Caption strip */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                            <p className="line-clamp-1 text-xs text-white/90">
                                {post.caption?.slice(0, 60) || "No caption"}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
