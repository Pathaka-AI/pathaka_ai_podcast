"use client";
import { CodeBlock } from "@/components/code-block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { example_response } from "@/lib/utils";
import React, { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface Topic {
  title: string;
  description: string;
  tags: string[];
}

interface ResearchResponse {
  research: {
    content: Array<{
      text: string;
    }>;
  };
  brave_search_results: Array<{
    title: string;
    description: string;
    url: string;
  }>;
}

export default function ResearchPodcast() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [podcastScript, setPodcastScript] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(true);

  const handleGetSuggestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestionsLoading(true);
    setError("");
    setTopics([]);

    try {
      const response = await fetch(
        `/api/topics?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch suggestions");
      }

      setTopics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleGeneratePodcast = async (selectedTopic: string) => {
    setLoading(true);
    setError("");
    setPodcastScript("");
    setSearchResults([]);
    setShowSuggestions(false);

    try {
      const response = await fetch(
        `/api/research?q=${encodeURIComponent(selectedTopic)}`
      );
      const data: any = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch research");
      }

      const formattedScript = JSON.stringify(data, null, 2);
      setPodcastScript(formattedScript);
      setSearchResults(data?.brave_search_results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      {/* Podcast Script Skeleton */}
      <div className="mb-8">
        <div className="h-8 w-64 bg-gray-800 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-800 rounded w-full" />
          <div className="h-4 bg-gray-800 rounded w-full" />
          <div className="h-4 bg-gray-800 rounded w-3/4" />
          <div className="h-4 bg-gray-800 rounded w-full" />
          <div className="h-4 bg-gray-800 rounded w-5/6" />
          <div className="h-4 bg-gray-800 rounded w-full" />
        </div>
      </div>

      {/* Reference Sources Skeleton */}
      <div>
        <div className="h-8 w-48 bg-gray-800 rounded mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border p-4 rounded">
              <div className="h-5 bg-gray-800 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-800 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Research Podcast Generator</h1>

      {showSuggestions ? (
        <>
          <form onSubmit={handleGetSuggestions} className="mb-8">
            <div className="flex gap-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What topics interest you?"
                className="flex-1 p-2 border rounded"
                required
              />
              <button
                type="submit"
                disabled={suggestionsLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {suggestionsLoading ? "Finding topics..." : "Get Topic Ideas"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {suggestionsLoading ? (
            <div className="space-y-4 ">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-6 bg-gray-800 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-800 rounded w-full mb-2" />
                  <div className="flex gap-2 ">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-6 bg-gray-800 rounded w-16" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div className=" grid grid-cols-3 gap-5 ">
                {topics.map((topic, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
                    onClick={() => handleGeneratePodcast(topic.title)}
                  >
                    <h3 className="text-lg font-semibold text-blue-600 mb-2">
                      {topic.title}
                    </h3>
                    {/* <p className="text-gray-600 mb-3">{topic.description}</p> */}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <button
            onClick={() => setShowSuggestions(true)}
            className="mb-6 text-blue-500 hover:text-blue-600"
          >
            ← Back to Topics
          </button>

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {podcastScript && (
                <div className="whitespace-pre-wrap">
                  <CodeBlock code={podcastScript} />
                </div>
              )}

              {searchResults?.length > 0 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">
                    Reference Sources
                  </h2>
                  <div className="space-y-4">
                    {searchResults.map((result, index) => (
                      <div key={index} className="border p-4 rounded">
                        <h3 className="font-semibold">
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {result.title}
                          </a>
                        </h3>
                        <p className="text-gray-600 mt-1">
                          {result.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
