import Link from 'next/link'

import {
  contentWidth,
  footnote,
  pageShell,
  pageTitle,
  sectionCopy,
  sectionHeading,
  textLink,
} from '@/app/styles/class-names'

import { HelpScreenshot } from './help-screenshot'
import { HELP_TOPICS } from './help-topics'

export const metadata = { title: '// Help //' }

const HelpPage = () => (
  <main className={pageShell}>
    <div className={contentWidth}>
      <h1 className={pageTitle}>Help</h1>
      {HELP_TOPICS.map((topic, index) => (
        <section
          key={topic.id}
          id={topic.id}
          className={index > 0 ? 'mt-10' : undefined}
        >
          <h2 className={sectionHeading}>
            {index + 1}. {topic.title}
          </h2>
          {topic.paragraphs.map((paragraph) => (
            <p key={paragraph} className={sectionCopy}>
              {paragraph}
            </p>
          ))}
          <div className="mt-4 flex flex-col gap-4">
            {topic.screenshots.map((image) => (
              <HelpScreenshot key={image.fileName} image={image} />
            ))}
          </div>
        </section>
      ))}
      <p className={footnote}>
        <Link href="/" className={textLink}>
          Back
        </Link>
      </p>
    </div>
  </main>
)

export default HelpPage
