import { SVGProps, useState } from "react";
import logo from "/icon.svg";
import { Dropzone } from "@/components/ui/dropzone";
import { BinaryFile } from "./types";
import { Button } from "@/components/ui/button";

function App() {
  const [imported, setImported] = useState<BinaryFile>({
    name: "Example Loro Document.wasm",
    binary: new Uint8Array(),
    importedTime: Date.now(),
    lastModified: Date.now(),
  });

  const [activeTab, setActiveTab] = useState<'state' | 'history' | 'timeline'>('state');
  const [historyPosition, setHistoryPosition] = useState<number>(0);

  return (
    <div className="dark min-h-[100vh] bg-gradient-to-b from-gray-950 to-gray-900 text-gray-200">
      {/* Header with improved styling */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-800 bg-gray-950/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 p-1.5">
            <img src={logo} className="h-full w-full" alt="Loro Inspector logo" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Loro Inspector</h1>
        </div>
        <a
          href="https://github.com/zxch3n/loro-inspector"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full bg-gray-800 px-4 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
        >
          <MdiGithub className="h-5 w-5" />
          <span>GitHub</span>
        </a>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero section */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Loro Document Inspector</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Inspect the internal state of your Loro documents, visualize document history, and navigate through time.
          </p>
        </div>

        {/* Main content area */}
        <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
          {/* Left column with dropzone and info */}
          <div className="flex flex-col gap-6 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="text-xl font-medium text-white">Upload Loro Document</div>
            <div className="mx-auto w-full max-w-md">
              <Dropzone
                onRead={(x) => {
                  setImported(x);
                  setHistoryPosition(0); // Reset to the beginning of history
                }}
              />
            </div>

            {imported.binary.length > 0 && (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-gray-800 bg-gray-900/80 p-4">
                  <h3 className="mb-2 font-medium text-white">Document Details</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span className="font-mono text-indigo-400">{imported.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-mono">{imported.binary.length} bytes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Imported:</span>
                      <span className="font-mono">{new Date(imported.importedTime).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-800 bg-gray-900/80 p-4">
                  <h3 className="mb-3 font-medium text-white">Document History</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-8 h-8 p-0 flex items-center justify-center"
                        disabled={historyPosition === 0}
                        onClick={() => setHistoryPosition(p => Math.max(0, p - 1))}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      </Button>
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${historyPosition * 10}%` }}
                        ></div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-8 h-8 p-0 flex items-center justify-center"
                        disabled={historyPosition >= 10}
                        onClick={() => setHistoryPosition(p => Math.min(10, p + 1))}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </Button>
                    </div>
                    <div className="text-center text-xs text-gray-500">
                      Viewing version {historyPosition} of {10}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right column with content */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            {imported.binary.length > 0 ? (
              <div className="space-y-6">
                <div className="border-b border-gray-800 pb-4">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setActiveTab('state')}
                      className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'state'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                    >
                      Document State
                    </button>
                    <button
                      onClick={() => setActiveTab('history')}
                      className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'history'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                    >
                      Operation History
                    </button>
                    <button
                      onClick={() => setActiveTab('timeline')}
                      className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'timeline'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                    >
                      Timeline View
                    </button>
                  </div>
                </div>

                {activeTab === 'state' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-medium text-white">Current Document State</h3>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm">Export JSON</Button>
                        <Button variant="default" size="sm">Refresh</Button>
                      </div>
                    </div>

                    {imported.binary.length > 10 ? (
                      <div>Placeholder</div>
                    ) : (
                      <div className="rounded-lg border border-gray-800 bg-gray-900/80 p-4">
                        <div className="min-h-[300px] flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <div className="mb-4 text-6xl">📄</div>
                            <p>Document state will appear here</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-medium text-white">Operation History</h3>
                      <Button variant="outline" size="sm">Filter Operations</Button>
                    </div>

                    <div className="rounded-lg border border-gray-800 bg-gray-900/80 p-4">
                      <div className="min-h-[400px]">
                        <div className="space-y-2">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`p-3 rounded-md border ${i === historyPosition
                                ? 'border-indigo-600 bg-indigo-900/20'
                                : 'border-gray-700 bg-gray-800/30'
                                }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-gray-300">
                                    Operation #{i + 1} - {i === 0 ? 'Initial State' : `Insert Text ${i}`}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {new Date(imported.importedTime - (5 - i) * 60000).toLocaleString()}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setHistoryPosition(i)}
                                  className={i === historyPosition ? 'text-indigo-400' : ''}
                                >
                                  View
                                </Button>
                              </div>
                              {i > 0 && (
                                <div className="text-xs text-gray-400 mt-2 font-mono bg-gray-800/50 p-2 rounded">
                                  {`{"op":"insert","path":["text"],"offset":${i * 10},"content":"Lorem ipsum"}`}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-medium text-white">Timeline Visualization</h3>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">By Author</Button>
                        <Button variant="outline" size="sm">By Time</Button>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-800 bg-gray-900/80 p-4">
                      <div className="min-h-[400px]">
                        <div className="h-64 w-full flex flex-col justify-end">
                          <div className="flex items-end h-48 w-full pb-2 gap-1">
                            {[...Array(20)].map((_, i) => (
                              <div
                                key={i}
                                className="flex-1 bg-indigo-600/80 hover:bg-indigo-500 cursor-pointer transition-all rounded-t-sm"
                                style={{
                                  height: `${Math.max(10, Math.sin(i / 3) * 100 + 20)}%`,
                                  opacity: historyPosition > i / 2 ? 1 : 0.4,
                                  backgroundColor: i % 3 === 0 ? 'rgb(79, 70, 229, 0.8)' : i % 3 === 1 ? 'rgb(16, 185, 129, 0.8)' : 'rgb(239, 68, 68, 0.8)'
                                }}
                                onClick={() => setHistoryPosition(Math.floor(i / 2))}
                              />
                            ))}
                          </div>
                          <div className="flex w-full gap-1 mt-2">
                            {[...Array(10)].map((_, i) => (
                              <div key={i} className="flex-1 text-center">
                                <div className={`h-1 bg-gray-700 ${historyPosition === i ? 'bg-indigo-500' : ''}`}></div>
                                <div className="text-xs text-gray-500 mt-1">{i + 1}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-4">
                          <div>11:30 AM</div>
                          <div>12:00 PM</div>
                          <div>12:30 PM</div>
                        </div>
                        <div className="flex justify-center mt-8">
                          <div className="flex gap-6">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                              <span className="text-xs text-gray-400">User 1</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-600"></div>
                              <span className="text-xs text-gray-400">User 2</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-600"></div>
                              <span className="text-xs text-gray-400">User 3</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
                <div className="rounded-full bg-gray-800/60 p-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white">No Loro Document Loaded</h3>
                <p className="max-w-sm text-gray-400">
                  Upload a Loro document file using the dropzone to inspect its content and history
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-800 bg-gray-950/30 py-8 text-center text-sm text-gray-500">
        <p>Loro Inspector &copy; {new Date().getFullYear()} • A tool for inspecting Loro document state and history</p>
      </footer>
    </div>
  );
}

export default App;

export function MdiGithub(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
      ></path>
    </svg>
  );
}
