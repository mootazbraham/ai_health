export default function Header() {
  return (
    <header className="bg-card-bg border-b border-card-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent to-success rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">H</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">HealthAI</h1>
            <p className="text-xs text-muted">Your Personal Health Companion</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-all duration-200 ease-in-out">
            Settings
          </button>
          <button className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-primary-dark transition-all duration-200 ease-in-out">
            Profile
          </button>
        </div>
      </div>
    </header>
  )
}
