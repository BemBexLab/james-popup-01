document.addEventListener("alpine:init", () => {
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
    toggleSubscription(id) {
      this.subscriptions[id] = !this.subscriptions[id];
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
