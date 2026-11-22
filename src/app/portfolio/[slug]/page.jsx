import { notFound } from 'next/navigation'
import PortfolioDetailClient from '@/features/portfolio/components/PortfolioDetailClient'
import { getPortfolioBySlug, getPortfolioProjects } from '@/lib/db/portfolio'

// Served from cache; refreshed hourly and immediately when an admin saves content.
export const revalidate = 3600

export async function generateStaticParams() {
  const projects = await getPortfolioProjects()
  return projects.map((project) => ({ slug: project.slug }))
}

export async function generateMetadata(props) {
  const params = await props.params
  const project = await getPortfolioBySlug(params.slug)
  if (!project) return {}

  return {
    title: project.title,
    description: project.description,
    openGraph: { images: [project.image] },
  }
}

export default async function PortfolioDetailPage(props) {
  const params = await props.params
  const [project, projects] = await Promise.all([
    getPortfolioBySlug(params.slug),
    getPortfolioProjects(),
  ])

  if (!project) notFound()

  const currentIdx = projects.findIndex((item) => item.slug === params.slug)
  const prevProject = projects[currentIdx - 1] || null
  const nextProject = projects[currentIdx + 1] || null

  return <PortfolioDetailClient project={project} prevProject={prevProject} nextProject={nextProject} />
}
