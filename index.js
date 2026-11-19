document.addEventListener("alpine:init", () => {
  Alpine.directive("image", (element, { expression }, { evaluateLater, effect, cleanup }) => {
    const readSource = evaluateLater(expression);
    const frame = element.parentElement;
    let revision = 0;

    effect(() => readSource((source) => {
      const currentRevision = ++revision;
      frame.dataset.state = source ? "loading" : "empty";
      frame.setAttribute("aria-busy", String(Boolean(source)));
      element.removeAttribute("src");
      if (!source) return;

      // Decode before revealing; ignore results from an earlier slide selection.
      const pending = new Image();
      pending.onload = async () => {
        if (currentRevision !== revision) return;
        try {
          element.src = source;
          await element.decode();
          if (currentRevision !== revision) return;
          frame.dataset.state = "loaded";
        } catch {
          if (currentRevision !== revision) return;
          frame.dataset.state = "error";
          element.removeAttribute("src");
        }
        frame.setAttribute("aria-busy", "false");
      };
      pending.onerror = () => {
        if (currentRevision !== revision) return;
        frame.dataset.state = "error";
        frame.setAttribute("aria-busy", "false");
      };
      pending.src = source;
    }));
    cleanup(() => { revision += 1; });
  });

  Alpine.data("danceBattle", () => ({
    activeSlot: 1,
    selectedTeamIds: [],
    subscriptions: {},
    stats: [],
    availableTeams: [],
    battleDocument: {},
    get teams() {
      return this.selectedTeamIds.map(id => this.availableTeams.find(team => team.id === id));
    },
    get activeTeamId() {
      return this.selectedTeamIds[this.activeSlot];
    },
    async init() {
      try {
        const response = await fetch("dummy.json");
        if (!response.ok) throw new Error(`Battle data request failed: ${response.status}`);
        const data = await response.json();
        this.stats = data.stats;
        this.availableTeams = data.teams;
        this.selectedTeamIds = data.teams.slice(0, 2).map(team => team.id);
        this.activeSlot = Math.max(0, this.selectedTeamIds.length - 1);
        this.battleDocument = data.document;
      } catch (error) {
        console.error("Could not load battle overview data.", error);
      }
    },
    selectSlot(index) {
      if (index >= 0 && index < this.selectedTeamIds.length) this.activeSlot = index;
    },
    selectTeam(id) {
      if (!this.availableTeams.some(team => team.id === id)) return;
      if (id === this.activeTeamId) return;
      const nextIds = [...this.selectedTeamIds];
      const otherSlot = nextIds.indexOf(id);
      // Keep opponents distinct when the selected team is already in the matchup.
      if (otherSlot !== -1) nextIds[otherSlot] = this.activeTeamId;
      nextIds[this.activeSlot] = id;
      this.selectedTeamIds = nextIds;
    },
    changeTeam(direction) {
      if (this.availableTeams.length < 2) return;
      const current = this.availableTeams.findIndex(team => team.id === this.activeTeamId);
      const next = (current + direction + this.availableTeams.length) % this.availableTeams.length;
      this.selectTeam(this.availableTeams[next].id);
    },
    toggleSubscription(id, button) {
      this.subscriptions[id] = !this.subscriptions[id];
      // Restart feedback on rapid clicks without queuing animations.
      button.getAnimations().forEach((animation) => animation.cancel());
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      button.animate(
        this.subscriptions[id]
          ? [
              { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(255, 211, 52, 0.5)" },
              { transform: "scale(0.94)", offset: 0.18 },
              { transform: "scale(1.07)", offset: 0.5 },
              { transform: "scale(1)", boxShadow: "0 0 0 10px rgba(255, 211, 52, 0)" },
            ]
          : [
              { transform: "scale(1)" },
              { transform: "scale(0.96)" },
              { transform: "scale(1)" },
            ],
        {
          duration: this.subscriptions[id] ? 480 : 220,
          easing: "ease-out",
        },
      );
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
