/**
 * ギャラリーページのAlpine.jsデータストア
 * manifest.jsonからプロジェクト一覧を読み込み、タグフィルター機能を提供
 */
document.addEventListener('alpine:init', () => {
  Alpine.data('gallery', () => ({
    projects: [],
    activeTag: 'all',
    loading: true,
    error: false,

    get allTags() {
      return [...new Set(this.projects.flatMap(p => p.tags))].sort();
    },

    get filtered() {
      if (this.activeTag === 'all') return this.projects;
      return this.projects.filter(p => p.tags.includes(this.activeTag));
    },

    get countText() {
      const n = this.filtered.length;
      return `${n} project${n !== 1 ? 's' : ''}`;
    },

    setTag(tag) {
      this.activeTag = tag;
    },

    async init() {
      try {
        const res = await fetch('./manifest.json');
        if (!res.ok) throw new Error('manifest.json not found');
        const data = await res.json();
        // 日付で降順ソート
        this.projects = data.sort((a, b) => b.date.localeCompare(a.date));
      } catch {
        this.error = true;
      } finally {
        this.loading = false;
      }
    }
  }));
});
