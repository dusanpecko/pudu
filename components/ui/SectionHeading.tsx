import Reveal from "@/components/effects/Reveal";

type SectionHeadingProps = {
  titleLine1: string;
  titleLine2?: string;
  description: string;
  id?: string;
};

/**
 * Two column section header: a large two-line headline on the left and a
 * supporting paragraph on the right.
 */
export default function SectionHeading({
  titleLine1,
  titleLine2,
  description,
  id,
}: SectionHeadingProps) {
  return (
    <Reveal className="head">
      <h2 id={id}>
        {titleLine1}
        {titleLine2 ? (
          <>
            <br />
            {titleLine2}
          </>
        ) : null}
      </h2>
      <p>{description}</p>
    </Reveal>
  );
}
