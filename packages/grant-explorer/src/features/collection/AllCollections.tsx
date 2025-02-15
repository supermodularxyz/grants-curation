import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useCopyToClipboard } from 'usehooks-ts'
import { Collection, encodeCollection, getAllCollections } from '../api/collections'
import { Project } from '../api/types'
import { BasicCard, CardsContainer, CardHeader, CardContent, CardTitle, CardDescription } from '../common/styles'
import { getProjects } from '../api/round'
import CollectionBanner from './CollectionBanner'
import { ProjectList } from '../round/ViewRoundPage'
import { Button } from 'common/src/styles'
import { ChevronRightIcon, LinkIcon } from '@heroicons/react/24/outline'

type Props = {
  projects?: Project[],
  isActiveRound: boolean
}

type CollectionItemProps = {
  collection: Collection,
  onCollectionClick: (collection: ActiveCollection) => void
}

type ActiveCollection = Omit<Collection, "projects"> & {
  projects: Project[]
}

const CollectionCard = ({ collection, onCollectionClick }: CollectionItemProps) => {
  const [projectsInCollection, setProjectsInCollection] = useState<Project[]>([])
  const { chainId, roundId } = useParams()

  const projectsCount = useMemo(() => collection.projects.length, [collection])

  const loadProjects = useCallback(async (projects: number[]) => {
    setProjectsInCollection((await getProjects(chainId, roundId as string, projects)) as Project[])
  }, [chainId, roundId])

  useEffect(() => {
    if (collection && collection.projects?.length > 0) {
      loadProjects(collection.projects)
    }
  }, [collection, loadProjects])

  return (<BasicCard className="relative" data-testid="collections-card" role="button" onClick={() => onCollectionClick({
    ...collection, projects: projectsInCollection
  })}>
    <CardHeader>
      <div className='flex flex-1 h-[180px]'>
        {projectsInCollection.length > 0 && <CollectionBanner height={180} images={projectsInCollection.map((i) => i.projectMetadata.bannerImg || "").slice(0, 4)} />}
      </div>
    </CardHeader>
    <CardContent className="px-2">
      <CardTitle data-testid="project-title">
        {collection.title}
      </CardTitle>
      <CardDescription className="mb-2 mt-0" data-testid="project-owner">
        {projectsCount} project{projectsCount === 1 ? "" : "s"}
      </CardDescription>
    </CardContent>
  </BasicCard>)
}

type CollectionPreviewProps = { collection: ActiveCollection, isActiveRound: boolean, backToLists: () => void }

const CollectionPreview = ({ collection, isActiveRound, backToLists }: CollectionPreviewProps) => {
  const [, copy] = useCopyToClipboard();

  const { chainId, roundId } = useParams();
  return (<div>
    <div className='flex my-4 justify-between'>
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <span role="button" onClick={backToLists}>My Lists</span>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <ChevronRightIcon className='w-3 h-3' strokeWidth={3} />
              <span className="ml-1 font-medium md:ml-2">{collection.title} ({collection.projects.length})</span>
            </div>
          </li>
        </ol>
      </nav>

      <Button $variant="secondary" className="flex flex-nowrap items-center" onClick={() => copy(`${window.location.protocol}//${window.location.host}/#/collection?data=${collection.enc}`)}>
        <LinkIcon className='w-4 h-4 mr-2' strokeWidth={3} />
        <span>Share list</span></Button>
    </div>
    <ProjectList projects={collection.projects} roundRoutePath={`/round/${chainId}/${roundId}`} isBeforeRoundEndDate={isActiveRound} isInCollection={true} roundId={roundId as string} />
  </div>)
}

const AllCollectionsView = ({ projects, isActiveRound }: Props) => {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loadingCollections, setLoadingCollections] = useState<boolean>(false)
  const [activeCollection, setActiveCollection] = useState<ActiveCollection>()
  const { chainId, roundId } = useParams();

  const loadAllCollections = useCallback(async (round: string) => {
    setLoadingCollections(true)
    const _collections = await getAllCollections(round)
    setCollections(_collections.map((i) => ({ ...i, enc: encodeURIComponent(encodeCollection(JSON.stringify(i))) })))
    setLoadingCollections(false)
  }, [])

  useEffect(() => {
    // load all the collections for this round here
    loadAllCollections(`${chainId}:${roundId}`);
  }, [chainId, roundId, projects, loadAllCollections])

  return (<div className='w-full flex flex-1'>
    {!loadingCollections && collections.length === 0 ? <div className='flex flex-col items-center w-full mt-6'>
      <div className='my-4'>No lists created yet</div>
      <img src='/empty-state.svg' className='w-full' />
    </div> : <CardsContainer>
      {activeCollection ? <CollectionPreview collection={activeCollection} isActiveRound={isActiveRound} backToLists={() => setActiveCollection(undefined)} /> : collections.map((collection) => <CollectionCard onCollectionClick={setActiveCollection} collection={collection} key={collection.id} />)}
    </CardsContainer>}
  </div>)
}

export default AllCollectionsView