interface Props {
  fullName: string;
  year: number;
}

export default function Footer({ fullName, year }: Props) {
  return (
    <footer className="footer">
      <p>
        © {year} {fullName}
      </p>
      {/* <p>Designed &amp; Developed by Me.</p> */}
    </footer>
  );
}
