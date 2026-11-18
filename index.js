document.addEventListener("alpine:init", () => {
  Alpine.data("danceBattle", () => ({
    activeSlide: 0,
    subscribed: [false, false],
    stats: [],
    teams: [],
    battleDocument: {},
    slides: [],
    async init() {
      try {
        const response = await fetch("dummy.json");
        if (!response.ok) throw new Error(`Battle data request failed: ${response.status}`);
        const data = await response.json();
        this.stats = data.stats;
        this.teams = data.teams;
        this.slides = data.slides;
        this.battleDocument = data.document;
      } catch (error) {
        console.error("Could not load battle overview data.", error);
      }
    },
    changeSlide(direction) {
      this.activeSlide =
        (this.activeSlide + direction + this.slides.length) %
        this.slides.length;
    },
    openDetails(event) {
      this.returnFocus = event.currentTarget;
      this.$refs.details.showModal();
      document.body.style.overflow = "hidden";
    },
    closeDetails() {
      if (!this.$refs.details.open) return;
      this.$refs.details.close();
      document.body.style.overflow = "";
      this.returnFocus?.focus();
    },
  }));
});
