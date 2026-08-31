import React from "react";
import { Award, Mail } from "lucide-react";
import { SiGithub } from '@icons-pack/react-simple-icons';

const LinkedInIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const teamMembers = [
  {
    name: "Niraj Bhatta",
    role: "Web Integration and Firebase",
    description: "Designed the real-time driver dashboard, console interface system, and responsive web layouts.",
    photo: "/member_niraj.jpg",
    socials: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      email: "mailto:niraj@kalki.io"
    }
  },
  {
    name: "Soniya Chand",
    role: "Hardware integration and Testing",
    description: "Architected the ESP32 sensor mesh network, firmware diagnostics, and serial communication protocols.",
    photo: "/member_soniya.jpeg",
    socials: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      email: "mailto:soniya@kalki.io"
    }
  },
  {
    name: "Ravi Yadav",
    role: "Embedded Systems Developer",
    description: "Engineered dual-sensor aggregation logic, Firebase database integration, and telemetry pipelines.",
    photo: "/member_ravi.jpg",
    socials: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      email: "mailto:ravi@kalki.io"
    }
  }
];

export default function Team() {
  return (
    <div className="flex-1 bg-kalki-bg text-kalki-textPrimary py-8 px-4 animate-in fade-in duration-300">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Header Block */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-kalki-live/10 border border-kalki-live text-kalki-live font-mono text-xs uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>Developer Node</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight uppercase">Kalki Development Team</h1>
          <p className="font-sans text-xs sm:text-sm text-kalki-textMuted max-w-lg mx-auto leading-relaxed">
            The engineering group responsible for designing, building, and deploying the Kalki real-time IoT smart parking system.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-kalki-border w-24 mx-auto" />

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className="bg-kalki-panel border border-kalki-border rounded-xl p-5 flex flex-col justify-between space-y-6 transition hover:border-kalki-textMuted/45"
            >
              <div className="space-y-4">

                {/* Image Container with precise framing */}
                <div className="relative aspect-square w-full bg-kalki-bg rounded-lg overflow-hidden border border-kalki-border">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full h-full object-cover grayscale opacity-90 transition hover:grayscale-0 duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-kalki-bg/90 border border-kalki-border px-2 py-0.5 rounded text-[8px] font-mono text-kalki-live font-bold uppercase tracking-wider">
                    Core_Dev
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-base text-kalki-textPrimary">{member.name}</h3>
                  <p className="font-mono text-xs text-kalki-live font-bold tracking-wide uppercase">{member.role}</p>
                </div>

                {/* Description */}
                <p className="font-sans text-xs text-kalki-textMuted leading-relaxed">
                  {member.description}
                </p>
              </div>

              {/* Social Links in Mono Style */}
              <div className="pt-4 border-t border-kalki-border/40 flex justify-between items-center">
                <span className="font-mono text-[9px] text-kalki-textMuted tracking-wider uppercase">COMM_LINKS:</span>
                <div className="flex gap-3 text-kalki-textMuted">
                  <a
                    href={member.socials.github}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-kalki-textPrimary transition p-1 hover:bg-kalki-bg border border-transparent hover:border-kalki-border rounded focus:outline-none focus:ring-2 focus:ring-kalki-live"
                    aria-label={`${member.name} GitHub`}
                  >
                    <SiGithub className="w-4 h-4" color="currentColor" />
                  </a>

                  <a
                    href={member.socials.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-kalki-textPrimary transition p-1 hover:bg-kalki-bg border border-transparent hover:border-kalki-border rounded focus:outline-none focus:ring-2 focus:ring-kalki-live"
                    aria-label={`${member.name} LinkedIn`}
                  >
                    <LinkedInIcon className="w-4 h-4" />
                  </a>

                  <a
                    href={member.socials.email}
                    className="hover:text-kalki-textPrimary transition p-1 hover:bg-kalki-bg border border-transparent hover:border-kalki-border rounded focus:outline-none focus:ring-2 focus:ring-kalki-live"
                    aria-label={`${member.name} Email`}
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}