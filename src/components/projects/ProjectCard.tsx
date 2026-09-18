"use client";



import type { ProjectSummary } from "@/lib/projects/types";

import { cn, formatPhotoCount } from "@/lib/utils";

import { ImageIcon } from "lucide-react";

import Image from "next/image";

import Link from "next/link";

import type { CSSProperties } from "react";



const CARD_ACCENTS = ["#5F4F92", "#6FB0B0", "#E3B233", "#CC2027"] as const;



type ProjectCardProps = {

  project: ProjectSummary;

  accentIndex?: number;

  className?: string;

  style?: CSSProperties;

};



export function ProjectCard({

  project,

  accentIndex = 0,

  className,

  style,

}: ProjectCardProps) {

  const accent = CARD_ACCENTS[accentIndex % CARD_ACCENTS.length];



  return (

    <Link

      href={`/projects/${project.slug}`}

      style={{ ...style, "--card-accent": accent } as CSSProperties}

      className={cn(

        "catalog-card mjms-fade-in group flex h-full flex-col overflow-hidden",

        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5F4F92] dark:focus-visible:ring-[#6FB0B0] focus-visible:ring-offset-2",

        className

      )}

    >

      <div className="catalog-card-media relative aspect-[4/3] overflow-hidden">

        {project.coverImageUrl ? (

          <Image

            src={project.coverImageUrl}

            alt={`${project.name} cover`}

            fill

            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"

            className="object-cover transition-transform duration-[220ms] ease-out group-hover:scale-[1.04]"

          />

        ) : (

          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">

            <ImageIcon className="h-7 w-7 opacity-25" aria-hidden />

            <span className="text-xs tracking-wide opacity-70">No photos</span>

          </div>

        )}

      </div>



      <div className="catalog-card-image-accent" aria-hidden />



      <div className="catalog-card-body">

        <h3 className="catalog-card-title truncate">{project.name}</h3>

        <span className="catalog-card-tag mt-2">{formatPhotoCount(project.photoCount)}</span>

      </div>

    </Link>

  );

}

