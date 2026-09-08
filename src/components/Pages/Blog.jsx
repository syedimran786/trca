import React from "react";
import SocialMeta from "../atoms/SocialMeta/SocialMeta";
import { Link } from "react-router-dom";
import { posts } from "./blog/posts";
import "./Blog.css";

const ORIGIN = "https://restcoderacademy.in";

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

// Blog index — lists posts (newest first from posts.js).
function Blog() {
  const url = `${ORIGIN}/blog`;
  const description =
    "Guides and honest advice on learning to code, getting hired, and full-stack development — from the team at Rest Coder Academy, Bengaluru.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Rest Coder Academy Blog",
    url,
    publisher: { "@type": "EducationalOrganization", name: "Rest Coder Academy", "@id": `${ORIGIN}/#org` },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      datePublished: p.date,
      url: `${ORIGIN}/blog/${p.slug}`,
    })),
  };

  const title = "Blog — Learning to Code & Getting Hired | Rest Coder Academy";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <SocialMeta title={title} description={description} url={url} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="bl">
        <header className="bl-hero">
          <span className="bl-eyebrow">Blog</span>
          <h1>Learning to code, getting hired — straight talk.</h1>
          <p>Guides and honest advice on full-stack development, choosing a path, and what actually gets you a job.</p>
        </header>

        <section className="bl-list">
          {posts.map((p) => (
            <article className="bl-item" key={p.slug}>
              <div className="bl-meta">
                <time dateTime={p.date}>{formatDate(p.date)}</time>
                <span>·</span>
                <span>{p.readMinutes} min read</span>
              </div>
              <h2><Link to={`/blog/${p.slug}`}>{p.title}</Link></h2>
              <p>{p.description}</p>
              <Link className="bl-read" to={`/blog/${p.slug}`}>Read →</Link>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}

export default Blog;
