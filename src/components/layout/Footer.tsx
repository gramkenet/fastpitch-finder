export default function Footer() {
  return (
    <footer className="border-t border-navy-200 bg-navy-950">
      <div className="container-page flex items-center justify-center h-14">
        <p className="text-body-sm text-navy-400">
          &copy; {new Date().getFullYear()} FastPitch Finder. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
