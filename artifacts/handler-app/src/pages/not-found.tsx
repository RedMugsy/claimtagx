import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="text-center py-16">
      <div className="text-6xl font-extrabold text-lime font-mono mb-2">404</div>
      <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
      <p className="text-slate mb-6">That route doesn't exist in the handler app.</p>
      <Link href="/">
        <Button className="bg-lime text-obsidian hover:bg-lime-hover font-bold rounded-xl">
          Back to command center
        </Button>
      </Link>
    </div>
  );
}
