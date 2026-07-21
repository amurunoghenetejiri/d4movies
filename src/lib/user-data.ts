import {
  useMutation,
  useQuery,
  useQueryClient,
  queryOptions,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapMovie, type Movie } from "./movies";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

// ---------- Watchlist ----------
export const watchlistQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["watchlist", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Movie[]> => {
      const { data, error } = await supabase
        .from("watchlist")
        .select("movies(*)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .map((x: any) => x.movies)
        .filter(Boolean)
        .map(mapMovie);
    },
  });

export function useWatchlist() {
  const { user } = useAuth();
  return useQuery(watchlistQueryOptions(user?.id));
}

export function useIsInWatchlist(movieDbId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["watchlist-has", user?.id, movieDbId],
    enabled: !!user && !!movieDbId,
    queryFn: async () => {
      const { data } = await supabase
        .from("watchlist")
        .select("id")
        .eq("user_id", user!.id)
        .eq("movie_id", movieDbId)
        .maybeSingle();
      return !!data;
    },
  });
}

export function useToggleWatchlist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      movieDbId,
      isIn,
    }: {
      movieDbId: string;
      isIn: boolean;
    }) => {
      if (!user) throw new Error("Sign in required");
      if (isIn) {
        const { error } = await supabase
          .from("watchlist")
          .delete()
          .eq("user_id", user.id)
          .eq("movie_id", movieDbId);
        if (error) throw error;
        return false;
      } else {
        const { error } = await supabase
          .from("watchlist")
          .insert({ user_id: user.id, movie_id: movieDbId });
        if (error) throw error;
        return true;
      }
    },
    onSuccess: (nowIn, vars) => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
      qc.setQueryData(["watchlist-has", user?.id, vars.movieDbId], nowIn);
      toast.success(nowIn ? "Added to Watchlist" : "Removed from Watchlist");
    },
    onError: (e: any) =>
      toast.error(e?.message ?? "Sign in to save to your Watchlist"),
  });
}

// ---------- Favorites ----------
export const favoritesQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["favorites", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Movie[]> => {
      const { data, error } = await supabase
        .from("favorites")
        .select("movies(*)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .map((x: any) => x.movies)
        .filter(Boolean)
        .map(mapMovie);
    },
  });

export function useFavorites() {
  const { user } = useAuth();
  return useQuery(favoritesQueryOptions(user?.id));
}

export function useIsFavorite(movieDbId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["favorite-has", user?.id, movieDbId],
    enabled: !!user && !!movieDbId,
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user!.id)
        .eq("movie_id", movieDbId)
        .maybeSingle();
      return !!data;
    },
  });
}

export function useToggleFavorite() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      movieDbId,
      isIn,
    }: {
      movieDbId: string;
      isIn: boolean;
    }) => {
      if (!user) throw new Error("Sign in required");
      if (isIn) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("movie_id", movieDbId);
        if (error) throw error;
        return false;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, movie_id: movieDbId });
        if (error) throw error;
        return true;
      }
    },
    onSuccess: (nowIn, vars) => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
      qc.setQueryData(["favorite-has", user?.id, vars.movieDbId], nowIn);
      toast.success(nowIn ? "Added to Favorites" : "Removed from Favorites");
    },
    onError: (e: any) =>
      toast.error(e?.message ?? "Sign in to save to your Favorites"),
  });
}

// ---------- History ----------
export function useHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watch_history")
        .select("progress, last_watched_at, movies(*)")
        .eq("user_id", user!.id)
        .order("last_watched_at", { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .filter((x: any) => x.movies)
        .map((x: any) => ({
          movie: mapMovie(x.movies),
          progress: Number(x.progress),
          watchedAt: x.last_watched_at as string,
        }));
    },
  });
}

export function useRecordProgress() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      movieDbId,
      progress,
    }: {
      movieDbId: string;
      progress: number;
    }) => {
      if (!user) return null;
      const { error } = await supabase.from("watch_history").upsert(
        {
          user_id: user.id,
          movie_id: movieDbId,
          progress,
          last_watched_at: new Date().toISOString(),
        },
        { onConflict: "user_id,movie_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["history"] }),
  });
}

// ---------- Downloads ----------
export function useDownloads() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["downloads", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("downloads")
        .select("id, status, progress, created_at, movies(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .filter((x: any) => x.movies)
        .map((x: any) => ({
          id: x.id as string,
          status: x.status as string,
          progress: Number(x.progress),
          movie: mapMovie(x.movies),
        }));
    },
  });
}

export function useQueueDownload() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (movieDbId: string) => {
      if (!user) throw new Error("Sign in to queue downloads");
      const { error } = await supabase.from("downloads").upsert(
        {
          user_id: user.id,
          movie_id: movieDbId,
          status: "queued",
          progress: 0,
        },
        { onConflict: "user_id,movie_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["downloads"] });
      toast.success("Added to Downloads");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not queue download"),
  });
}

export function useRemoveDownload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("downloads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["downloads"] });
      toast("Removed from Downloads");
    },
  });
}

// ---------- Movie likes ----------
export function useMovieLikes(movieDbId: string) {
  return useQuery({
    queryKey: ["movie-likes", movieDbId],
    enabled: !!movieDbId,
    queryFn: async () => {
      const { data } = await supabase
        .from("movie_likes")
        .select("value")
        .eq("movie_id", movieDbId);
      const rows = data ?? [];
      return {
        likes: rows.filter((r) => r.value === 1).length,
        dislikes: rows.filter((r) => r.value === -1).length,
      };
    },
  });
}

export function useMyMovieLike(movieDbId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["movie-like-me", user?.id, movieDbId],
    enabled: !!user && !!movieDbId,
    queryFn: async () => {
      const { data } = await supabase
        .from("movie_likes")
        .select("value")
        .eq("user_id", user!.id)
        .eq("movie_id", movieDbId)
        .maybeSingle();
      return (data?.value as number | undefined) ?? 0;
    },
  });
}

export function useSetMovieLike() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      movieDbId,
      value,
    }: {
      movieDbId: string;
      value: 1 | -1 | 0;
    }) => {
      if (!user) throw new Error("Sign in to rate movies");
      if (value === 0) {
        const { error } = await supabase
          .from("movie_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("movie_id", movieDbId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("movie_likes")
          .upsert(
            { user_id: user.id, movie_id: movieDbId, value },
            { onConflict: "user_id,movie_id" },
          );
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["movie-likes", vars.movieDbId] });
      qc.invalidateQueries({
        queryKey: ["movie-like-me", user?.id, vars.movieDbId],
      });
    },
    onError: (e: any) => toast.error(e?.message ?? "Sign in required"),
  });
}

// ---------- Comments ----------
export type CommentRow = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profile: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
};

export function useComments(movieDbId: string) {
  return useQuery({
    queryKey: ["comments", movieDbId],
    enabled: !!movieDbId,
    queryFn: async (): Promise<CommentRow[]> => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, content, created_at, user_id, parent_id, profiles(username, full_name, avatar_url)")
        .eq("movie_id", movieDbId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c: any) => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user_id: c.user_id,
        parent_id: c.parent_id,
        profile: c.profiles,
      }));
    },
  });
}

export function usePostComment(movieDbId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string | null }) => {
      if (!user) throw new Error("Sign in to comment");
      const { error } = await supabase.from("comments").insert({
        user_id: user.id,
        movie_id: movieDbId,
        content: content.trim(),
        parent_id: parentId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", movieDbId] });
      toast.success("Comment posted");
    },
    onError: (e: any) => toast.error(e?.message ?? "Please sign in to comment"),
  });
}

export function useDeleteComment(movieDbId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", movieDbId] });
      toast("Comment deleted");
    },
  });
}

// ---------- Reports ----------
export function useReport() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      targetType,
      targetId,
      reason,
    }: {
      targetType: string;
      targetId: string;
      reason: string;
    }) => {
      if (!user) throw new Error("Sign in to report");
      const { error } = await supabase
        .from("reports")
        .insert({ user_id: user.id, target_type: targetType, target_id: targetId, reason });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Report submitted — thank you"),
    onError: (e: any) => toast.error(e?.message ?? "Could not submit report"),
  });
}

// ---------- Notifications ----------
export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
