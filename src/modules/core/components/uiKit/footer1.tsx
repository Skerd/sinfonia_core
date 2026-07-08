export default function Footer1() {
  return (
    <footer className="font-medium">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-4 py-16 md:grid-cols-5">
        <nav className="col-span-2 md:col-span-1">
          <a href="/">
            <h4 className="text-foreground text-xl mb-2">Shadcn UI Kit</h4>
          </a>
        </nav>
        <nav className="text-muted-foreground flex flex-col items-start space-y-2.5 md:space-y-1.5 [&_a]:text-sm">
          <h4 className="text-foreground mb-2">Products</h4>
          <a href="#" className="hover:text-foreground transition">
            Todo List
          </a>
          <a href="#" className="hover:text-foreground transition">
            Product Management
          </a>
          <a href="#" className="hover:text-foreground transition">
            Git Manager
          </a>
          <a href="#" className="hover:text-foreground transition">
            Status Reporter
          </a>
          <a href="#" className="hover:text-foreground transition">
            Email Management
          </a>
          <a href="#" className="hover:text-foreground transition">
            Responsibilities
          </a>
          <a href="#" className="hover:text-foreground transition">
            Teams
          </a>
        </nav>
        <nav className="text-muted-foreground flex flex-col items-start space-y-2.5 md:space-y-1.5 [&_a]:text-sm">
          <h4 className="text-foreground mb-2">Resources</h4>
          <a href="#" className="hover:text-foreground transition">
            Technical Support
          </a>
          <a href="#" className="hover:text-foreground transition">
            Licensing
          </a>
          <a href="#" className="hover:text-foreground transition">
            Community
          </a>
          <a href="#" className="hover:text-foreground transition">
            Knowledge Base
          </a>
          <a href="#" className="hover:text-foreground transition">
            Marketplace
          </a>
          <a href="#" className="hover:text-foreground transition">
            My Account
          </a>
          <a href="#" className="hover:text-foreground transition">
            Support Ticket
          </a>
        </nav>
        <nav className="text-muted-foreground flex flex-col items-start space-y-2.5 md:space-y-1.5 [&_a]:text-sm">
          <h4 className="text-foreground mb-2">Learn</h4>
          <a href="#" className="hover:text-foreground transition">
            Certification
          </a>
          <a href="#" className="hover:text-foreground transition">
            Partners
          </a>
          <a href="#" className="hover:text-foreground transition">
            Documentation
          </a>
          <a href="#" className="hover:text-foreground transition">
            Developer Resources
          </a>
          <a href="#" className="hover:text-foreground transition">
            Purchasing FAQ
          </a>
          <a href="#" className="hover:text-foreground transition">
            Enterprise services
          </a>
        </nav>
        <nav className="text-muted-foreground flex flex-col items-start space-y-2.5 md:space-y-1.5 [&_a]:text-sm">
          <h4 className="text-foreground mb-2">About Us</h4>
          <a href="#" className="hover:text-foreground transition">
            Company
          </a>
          <a href="#" className="hover:text-foreground transition">
            Careers
          </a>
          <a href="#" className="hover:text-foreground transition">
            Events
          </a>
          <a href="#" className="hover:text-foreground transition">
            Blogs
          </a>
          <a href="#" className="hover:text-foreground transition">
            Contact
          </a>
          <a href="#" className="hover:text-foreground transition">
            Security
          </a>
          <a href="#" className="hover:text-foreground transition">
            Privacy
          </a>
        </nav>
      </div>
    </footer>
  );
}
