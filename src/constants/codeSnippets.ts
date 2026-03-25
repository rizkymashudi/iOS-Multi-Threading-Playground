import type { SceneId } from '../types/scene'

export const CODES: Record<SceneId, string> = {
  gcd: `<span class="cm">// Serial queue — one task at a time</span>
<span class="kw">let</span> serial = <span class="fn">DispatchQueue</span>(
    label: <span class="str">"com.app.serial"</span>
)

serial.<span class="fn">async</span> { doWork(<span class="num">1</span>) }
serial.<span class="fn">async</span> { doWork(<span class="num">2</span>) }
serial.<span class="fn">async</span> { doWork(<span class="num">3</span>) }
<span class="cm">// runs 1 → 2 → 3 in order</span>

<span class="cm">// Concurrent queue — parallel tasks</span>
<span class="kw">let</span> concurrent = <span class="fn">DispatchQueue</span>.global(
    qos: .userInitiated
)

concurrent.<span class="fn">async</span> { doWork(<span class="num">1</span>) }
concurrent.<span class="fn">async</span> { doWork(<span class="num">2</span>) }
concurrent.<span class="fn">async</span> { doWork(<span class="num">3</span>) }
<span class="cm">// runs 1, 2, 3 simultaneously</span>`,

  mainthread: `<span class="cm">// CORRECT ✓</span>
<span class="fn">DispatchQueue</span>.global().<span class="fn">async</span> {
    <span class="kw">let</span> data = <span class="fn">fetchData</span>()

    <span class="fn">DispatchQueue</span>.main.<span class="fn">async</span> {
        <span class="cm">// safe — on main thread</span>
        <span class="kw">self</span>.label.text = data.title
    }
}

<span class="cm">// WRONG ✗ — UI from background</span>
<span class="fn">DispatchQueue</span>.global().<span class="fn">async</span> {
    <span class="kw">let</span> data = <span class="fn">fetchData</span>()
    <span class="cm">// updating UI here → CRASH</span>
    <span class="kw">self</span>.label.text = data.title
}

<span class="cm">// MODERN — @MainActor</span>
<span class="kw">@MainActor</span>
<span class="kw">func</span> <span class="fn">updateUI</span>(_ data: Data) {
    label.text = data.title <span class="cm">// safe</span>
}`,

  qos: `<span class="cm">// QoS from highest → lowest priority</span>

<span class="fn">DispatchQueue</span>.global(qos: .userInteractive)
    .<span class="fn">async</span> { <span class="cm">/* animations, direct interaction */</span> }

<span class="fn">DispatchQueue</span>.global(qos: .userInitiated)
    .<span class="fn">async</span> { <span class="cm">/* user triggered, awaiting result */</span> }

<span class="fn">DispatchQueue</span>.global(qos: .default)
    .<span class="fn">async</span> { <span class="cm">/* general work */</span> }

<span class="fn">DispatchQueue</span>.global(qos: .utility)
    .<span class="fn">async</span> { <span class="cm">/* long running, progress bar */</span> }

<span class="fn">DispatchQueue</span>.global(qos: .background)
    .<span class="fn">async</span> { <span class="cm">/* not time-sensitive, sync */</span> }`,

  deadlock: `<span class="cm">// DEADLOCK ✗</span>
<span class="cm">// On main thread, calling sync back to main</span>
<span class="kw">override func</span> <span class="fn">viewDidLoad</span>() {
    <span class="kw">super</span>.<span class="fn">viewDidLoad</span>()

    <span class="fn">DispatchQueue</span>.main.<span class="fn">sync</span> {
        <span class="cm">// main waits for main → DEADLOCK</span>
        label.text = <span class="str">"hello"</span>
    }
}

<span class="cm">// FIX ✓ — always use async</span>
<span class="fn">DispatchQueue</span>.main.<span class="fn">async</span> {
    label.text = <span class="str">"hello"</span>
}

<span class="cm">// Or if already on main thread, just:</span>
label.text = <span class="str">"hello"</span>`,

  race: `<span class="cm">// DATA RACE ✗</span>
<span class="kw">var</span> counter = <span class="num">0</span>

<span class="fn">DispatchQueue</span>.global().<span class="fn">async</span> {
    counter += <span class="num">1</span> <span class="cm">// race!</span>
}
<span class="fn">DispatchQueue</span>.global().<span class="fn">async</span> {
    counter += <span class="num">1</span> <span class="cm">// race!</span>
}

<span class="cm">// FIX ✓ — serial queue isolation</span>
<span class="kw">let</span> queue = <span class="fn">DispatchQueue</span>(
    label: <span class="str">"com.app.counter"</span>
)
<span class="kw">var</span> counter = <span class="num">0</span>

queue.<span class="fn">async</span> { counter += <span class="num">1</span> }
queue.<span class="fn">async</span> { counter += <span class="num">1</span> }
<span class="cm">// serialized — always correct</span>`,

  explosion: `<span class="cm">// THREAD EXPLOSION ✗</span>
<span class="kw">let</span> concurrent = <span class="fn">DispatchQueue</span>.global()

<span class="cm">// Each sync blocks a thread →</span>
<span class="cm">// GCD spawns new threads →</span>
<span class="cm">// Cascades to 100s of threads!</span>
<span class="kw">for</span> _ <span class="kw">in</span> <span class="num">0</span>..&lt;<span class="num">100</span> {
    concurrent.<span class="fn">async</span> {
        concurrent.<span class="fn">sync</span> { work() }
    }
}

<span class="cm">// FIX ✓ — use async, not sync</span>
<span class="kw">for</span> _ <span class="kw">in</span> <span class="num">0</span>..&lt;<span class="num">100</span> {
    concurrent.<span class="fn">async</span> { work() }
}

<span class="cm">// Or with Swift Concurrency:</span>
<span class="fn">Task</span> { <span class="kw">await</span> work() } <span class="cm">// no blocking</span>`,

  barrier: `<span class="kw">let</span> rwQueue = <span class="fn">DispatchQueue</span>(
    label: <span class="str">"com.app.rw"</span>,
    attributes: .concurrent
)
<span class="kw">var</span> data: [<span class="type">String</span>] = []

<span class="cm">// Multiple concurrent reads ✓</span>
<span class="kw">func</span> <span class="fn">read</span>() -&gt; [<span class="type">String</span>] {
    rwQueue.<span class="fn">sync</span> { data }
}

<span class="cm">// Exclusive barrier write ✓</span>
<span class="kw">func</span> <span class="fn">write</span>(_ value: <span class="type">String</span>) {
    rwQueue.<span class="fn">async</span>(flags: .barrier) {
        <span class="cm">// waits for readers, runs alone</span>
        data.<span class="fn">append</span>(value)
    }
}`,

  actor: `<span class="cm">// Without actor — data race ✗</span>
<span class="kw">class</span> <span class="type">UnsafeCounter</span> {
    <span class="kw">var</span> count = <span class="num">0</span>
    <span class="kw">func</span> <span class="fn">increment</span>() { count += <span class="num">1</span> }
}

<span class="cm">// With actor — thread safe ✓</span>
<span class="kw">actor</span> <span class="type">SafeCounter</span> {
    <span class="kw">var</span> count = <span class="num">0</span>
    <span class="kw">func</span> <span class="fn">increment</span>() { count += <span class="num">1</span> }
}

<span class="kw">let</span> counter = <span class="fn">SafeCounter</span>()

<span class="cm">// Callers must await — serialized</span>
<span class="fn">Task</span> { <span class="kw">await</span> counter.<span class="fn">increment</span>() }
<span class="fn">Task</span> { <span class="kw">await</span> counter.<span class="fn">increment</span>() }`,

  serial: `<span class="kw">class</span> <span class="type">SafeStore</span> {
    <span class="kw">private var</span> data: [<span class="type">String</span>] = []
    <span class="kw">private let</span> queue = <span class="fn">DispatchQueue</span>(
        label: <span class="str">"com.store.serial"</span>
    )

    <span class="kw">func</span> <span class="fn">append</span>(_ value: <span class="type">String</span>) {
        queue.<span class="fn">async</span> {
            <span class="kw">self</span>.data.<span class="fn">append</span>(value)
        }
    }

    <span class="kw">func</span> <span class="fn">read</span>() -&gt; [<span class="type">String</span>] {
        queue.<span class="fn">sync</span> { data }
    }
}`,

  asyncawait: `<span class="cm">// Cooperative pool — no blocking</span>
<span class="kw">func</span> <span class="fn">loadProfile</span>() <span class="kw">async</span> {
    <span class="cm">// Suspends here — thread is freed</span>
    <span class="kw">let</span> data = <span class="kw">await</span> <span class="fn">fetchFromAPI</span>()

    <span class="cm">// Resume on cooperative pool</span>
    <span class="kw">let</span> parsed = <span class="fn">parse</span>(data)

    <span class="cm">// Hop to main for UI</span>
    <span class="kw">await</span> MainActor.<span class="fn">run</span> {
        label.text = parsed.name
    }
}

<span class="cm">// Or annotate class as @MainActor:</span>
<span class="kw">@MainActor</span>
<span class="kw">class</span> <span class="type">ViewModel</span>: ObservableObject {
    <span class="kw">func</span> <span class="fn">load</span>() <span class="kw">async</span> {
        title = <span class="kw">await</span> <span class="fn">fetchTitle</span>()
    }
}`,

  combine: `<span class="kw">var</span> cancellable: <span class="type">AnyCancellable</span>?

cancellable = apiPublisher
    <span class="cm">// Work runs on background queue</span>
    .<span class="fn">subscribe</span>(on:
        <span class="fn">DispatchQueue</span>.global(qos: .userInitiated)
    )
    .<span class="fn">map</span> { response <span class="kw">in</span>
        response.<span class="fn">parse</span>() <span class="cm">// background</span>
    }
    <span class="cm">// Delivery switches to main</span>
    .<span class="fn">receive</span>(on: <span class="fn">DispatchQueue</span>.main)
    .<span class="fn">sink</span>(
        receiveCompletion: { _ <span class="kw">in</span> },
        receiveValue: { [<span class="kw">weak self</span>] data <span class="kw">in</span>
            <span class="cm">// Safe — on main thread</span>
            <span class="kw">self</span>?.label.text = data.title
        }
    )`,

  reentrancy: `<span class="kw">actor</span> <span class="type">Cache</span> {
    <span class="kw">var</span> data: <span class="type">String</span>? = <span class="kw">nil</span>
    <span class="kw">var</span> isLoading = <span class="kw">false</span>

    <span class="cm">// BUG ✗ — reentrancy issue</span>
    <span class="kw">func</span> <span class="fn">buggyLoad</span>() <span class="kw">async</span> {
        <span class="kw">guard</span> !isLoading <span class="kw">else</span> { <span class="kw">return</span> }
        isLoading = <span class="kw">true</span>
        <span class="cm">// Actor suspends here! Another</span>
        <span class="cm">// task can enter and see isLoading=true</span>
        data = <span class="kw">await</span> <span class="fn">fetchData</span>()
        isLoading = <span class="kw">false</span>
    }

    <span class="cm">// FIX ✓ — re-check after await</span>
    <span class="kw">func</span> <span class="fn">safeLoad</span>() <span class="kw">async</span> {
        <span class="kw">guard</span> data == <span class="kw">nil</span>, !isLoading
            <span class="kw">else</span> { <span class="kw">return</span> }
        isLoading = <span class="kw">true</span>
        <span class="kw">let</span> result = <span class="kw">await</span> <span class="fn">fetchData</span>()
        <span class="kw">guard</span> data == <span class="kw">nil</span> <span class="kw">else</span> { <span class="kw">return</span> }
        data = result
        isLoading = <span class="kw">false</span>
    }
`,

  dispatchgroup: `<span class="cm">// Real world: load dashboard data in parallel</span>
<span class="kw">let</span> group = <span class="fn">DispatchGroup</span>()

group.<span class="fn">enter</span>()
<span class="fn">fetchUserProfile</span> { profile <span class="kw">in</span>
    defer { group.<span class="fn">leave</span>() }
    <span class="cm">// store profile</span>
}

group.<span class="fn">enter</span>()
<span class="fn">fetchBalance</span> { balance <span class="kw">in</span>
    defer { group.<span class="fn">leave</span>() }
    <span class="cm">// store balance</span>
}

group.<span class="fn">enter</span>()
<span class="fn">fetchDataQuota</span> { quota <span class="kw">in</span>
    defer { group.<span class="fn">leave</span>() }
    <span class="cm">// store quota</span>
}

<span class="cm">// Fires when ALL three complete</span>
group.<span class="fn">notify</span>(queue: .main) {
    <span class="kw">self</span>.<span class="fn">refreshDashboard</span>()
}`,

  semaphore: `<span class="cm">// Real world: limit concurrent photo uploads</span>
<span class="kw">let</span> semaphore = <span class="fn">DispatchSemaphore</span>(value: <span class="num">2</span>)
<span class="kw">let</span> photos: [<span class="type">Photo</span>] = <span class="fn">pendingPhotos</span>()

<span class="fn">DispatchQueue</span>.global().<span class="fn">async</span> {
    photos.<span class="fn">forEach</span> { photo <span class="kw">in</span>
        <span class="cm">// Blocks if 2 uploads already running</span>
        semaphore.<span class="fn">wait</span>()

        <span class="fn">uploadPhoto</span>(photo) { result <span class="kw">in</span>
            defer { semaphore.<span class="fn">signal</span>() }
            <span class="fn">handleResult</span>(result)
        }
    }
}`,

  taskgroup: `<span class="cm">// Real world: fetch all localization bundles</span>
<span class="kw">func</span> <span class="fn">fetchAllBundles</span>() <span class="kw">async</span> -&gt; [<span class="type">Bundle</span>] {
    <span class="kw">await</span> <span class="fn">withTaskGroup</span>(of: <span class="type">Bundle</span>?.self) { group <span class="kw">in</span>
        <span class="kw">let</span> locales = [<span class="str">"en"</span>,<span class="str">"id"</span>,<span class="str">"ms"</span>,<span class="str">"th"</span>,<span class="str">"vi"</span>,<span class="str">"zh"</span>]

        locales.<span class="fn">forEach</span> { locale <span class="kw">in</span>
            group.<span class="fn">addTask</span> {
                <span class="kw">await</span> <span class="fn">fetchBundle</span>(locale: locale)
            }
        }

        <span class="cm">// Collect as each finishes (order may vary)</span>
        <span class="kw">var</span> results: [<span class="type">Bundle</span>] = []
        <span class="kw">for await</span> bundle <span class="kw">in</span> group {
            <span class="kw">if let</span> b = bundle { results.<span class="fn">append</span>(b) }
        }
        <span class="kw">return</span> results
    }
}`,

  taskcancellation: `<span class="cm">// Real world: search task cancelled on nav</span>
<span class="kw">var</span> searchTask: <span class="type">Task</span>&lt;<span class="type">Void</span>, <span class="type">Never</span>&gt;?

<span class="kw">func</span> <span class="fn">search</span>(query: <span class="type">String</span>) {
    searchTask?.<span class="fn">cancel</span>() <span class="cm">// cancel previous</span>
    searchTask = <span class="fn">Task</span> {
        <span class="cm">// Checkpoint 1: before network</span>
        <span class="kw">guard</span> !Task.isCancelled <span class="kw">else</span> { <span class="kw">return</span> }
        <span class="kw">let</span> results = <span class="kw">await</span> <span class="fn">searchAPI</span>(query)

        <span class="cm">// Checkpoint 2: before parse</span>
        <span class="kw">try</span>? Task.<span class="fn">checkCancellation</span>()
        <span class="kw">let</span> parsed = <span class="fn">parse</span>(results)

        <span class="cm">// Checkpoint 3: before UI update</span>
        <span class="kw">guard</span> !Task.isCancelled <span class="kw">else</span> { <span class="kw">return</span> }
        <span class="kw">await</span> MainActor.<span class="fn">run</span> {
            <span class="kw">self</span>.<span class="fn">updateResults</span>(parsed)
        }
    }
}

<span class="kw">func</span> <span class="fn">viewDidDisappear</span>() {
    searchTask?.<span class="fn">cancel</span>()
}`,

  locks: `<span class="cm">// Real world: thread-safe analytics buffer</span>
<span class="kw">class</span> <span class="type">AnalyticsSDK</span> {
    <span class="kw">private var</span> events: [<span class="type">Event</span>] = []

    <span class="cm">// Option A: NSLock (simple, safe)</span>
    <span class="kw">private let</span> lock = <span class="fn">NSLock</span>()

    <span class="kw">func</span> <span class="fn">track</span>(_ event: <span class="type">Event</span>) {
        lock.<span class="fn">lock</span>()
        <span class="kw">defer</span> { lock.<span class="fn">unlock</span>() }
        events.<span class="fn">append</span>(event)
    }

    <span class="cm">// Option B: os_unfair_lock (faster)</span>
    <span class="kw">private var</span> unfairLock = os_unfair_lock()

    <span class="kw">func</span> <span class="fn">trackFast</span>(_ event: <span class="type">Event</span>) {
        os_unfair_lock_lock(&amp;unfairLock)
        <span class="kw">defer</span> { os_unfair_lock_unlock(&amp;unfairLock) }
        events.<span class="fn">append</span>(event)
    }
}`,

  atomic: `<span class="cm">// Swift properties are NOT atomic by default</span>
<span class="cm">// Build your own @Atomic wrapper:</span>

<span class="kw">@propertyWrapper</span>
<span class="kw">struct</span> <span class="type">Atomic</span>&lt;<span class="type">Value</span>&gt; {
    <span class="kw">private var</span> value: <span class="type">Value</span>
    <span class="kw">private let</span> queue = <span class="fn">DispatchQueue</span>(
        label: <span class="str">"atomic"</span>
    )

    <span class="kw">var</span> wrappedValue: <span class="type">Value</span> {
        <span class="kw">get</span> { queue.<span class="fn">sync</span> { value } }
        <span class="kw">set</span> { queue.<span class="fn">sync</span> { value = newValue } }
    }
}

<span class="cm">// Usage in SDK:</span>
<span class="kw">@Atomic var</span> pendingRequests = <span class="num">0</span>
<span class="cm">// safe from any thread:</span>
pendingRequests += <span class="num">1</span>`,

  sendable: `<span class="cm">// NON-Sendable ✗ — class is a reference type</span>
<span class="kw">class</span> <span class="type">SDKConfig</span> {        <span class="cm">// ← NOT Sendable</span>
    <span class="kw">var</span> timeout: <span class="type">Int</span> = <span class="num">30</span>
    <span class="kw">var</span> retries: <span class="type">Int</span> = <span class="num">3</span>
}

<span class="cm">// Passing to another actor mutates same ref</span>
<span class="cm">// → both actors see each other's changes!</span>

<span class="cm">// SENDABLE ✓ — struct is a value type</span>
<span class="kw">struct</span> <span class="type">SDKConfig</span>: <span class="type">Sendable</span> {
    <span class="kw">let</span> timeout: <span class="type">Int</span>
    <span class="kw">let</span> retries: <span class="type">Int</span>
}

<span class="cm">// Crossing an actor boundary copies the value</span>
<span class="cm">// → each actor has its own independent copy</span>

<span class="kw">actor</span> <span class="type">NetworkManager</span> {
    <span class="kw">func</span> <span class="fn">configure</span>(_ c: <span class="type">SDKConfig</span>) { }
}`,

  priorityinversion: `<span class="cm">// Priority inversion scenario</span>

<span class="cm">// Background task holds the lock</span>
<span class="fn">DispatchQueue</span>.global(qos: .background)
    .<span class="fn">async</span> {
        lock.<span class="fn">lock</span>()           <span class="cm">// acquired!</span>
        <span class="fn">longRunningSync</span>()    <span class="cm">// holds for 2s</span>
        lock.<span class="fn">unlock</span>()
    }

<span class="cm">// High-priority animation task needs lock</span>
<span class="fn">DispatchQueue</span>.global(qos: .userInteractive)
    .<span class="fn">async</span> {
        lock.<span class="fn">lock</span>()   <span class="cm">// BLOCKED by background!</span>
        <span class="fn">updateAnimation</span>()
        lock.<span class="fn">unlock</span>()
    }

<span class="cm">// Fix: GCD auto-elevates the background task's</span>
<span class="cm">// QoS to match the waiter — resolves inversion</span>`,
}
