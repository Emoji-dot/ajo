"use client";
// Cta component.

import Link from "next/link";
import { motion } from "framer-motion";

export function Cta() {
  return (
    <section className="border-t border-border bg-accent text-accent-foreground">
      <div className="relative mx-auto max-w-6xl overflow-hidden px-4 py-20 sm:px-6">
        <motion.div
          className="ring-motif pointer-events-none absolute -right-24 -top-24 h-72 w-72 border-accent-foreground/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="ring-motif pointer-events-none absolute -bottom-32 -left-16 h-56 w-56 border-accent-foreground/10"
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <p className="eyebrow !text-accent-foreground/80">Get started</p>
          <h2 className="font-display mt-3 max-w-xl text-3xl italic tracking-tight sm:text-4xl">
            Free while Ajo is on testnet
          </h2>
          <p className="mt-4 max-w-xl text-accent-foreground/75">
            Connect a Stellar wallet, fund it with testnet XLM, and start or join a circle — no signup, no account,
            no email.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/circles"
              className="rounded-full bg-accent-foreground px-6 py-3 text-center text-sm font-medium text-accent hover:opacity-90"
            >
              Launch the app
            </Link>
            <a
              href="https://lab.stellar.org/account/fund?network=testnet"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-accent-foreground/40 px-6 py-3 text-center text-sm font-medium text-accent-foreground hover:bg-accent-foreground/10"
            >
              Fund a testnet wallet
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}