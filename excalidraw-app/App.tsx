import {
	Excalidraw,
	TTDDialogTrigger,
	CaptureUpdateAction,
} from "@excalidraw/excalidraw";
import { trackEvent } from "@excalidraw/excalidraw/analytics";
import {
	CommandPalette,
	DEFAULT_CATEGORIES,
} from "@excalidraw/excalidraw/components/CommandPalette/CommandPalette";
import { ErrorDialog } from "@excalidraw/excalidraw/components/ErrorDialog";
import { OverwriteConfirmDialog } from "@excalidraw/excalidraw/components/OverwriteConfirm/OverwriteConfirm";
import {
	APP_NAME,
	EVENT,
	THEME,
	VERSION_TIMEOUT,
	debounce,
	getVersion,
	getFrame,
	isTestEnv,
	preventUnload,
	resolvablePromise,
	isDevEnv,
} from "@excalidraw/common";
import polyfill from "@excalidraw/excalidraw/polyfill";
import { useEffect, useRef, useState } from "react";
import { loadFromBlob } from "@excalidraw/excalidraw/data/blob";
import { useCallbackRefState } from "@excalidraw/excalidraw/hooks/useCallbackRefState";
import { t } from "@excalidraw/excalidraw/i18n";

import {
	GithubIcon,
	XBrandIcon,
	DiscordIcon,
	youtubeIcon,
} from "@excalidraw/excalidraw/components/icons";
import { isElementLink } from "@excalidraw/element";
import { restore } from "@excalidraw/excalidraw/data/restore";
import { newElementWith } from "@excalidraw/element";
import { isInitializedImageElement } from "@excalidraw/element";
import {
	parseLibraryTokensFromUrl,
	useHandleLibrary,
} from "@excalidraw/excalidraw/data/library";

import type { RestoredDataState } from "@excalidraw/excalidraw/data/restore";
import type {
	FileId,
	NonDeletedExcalidrawElement,
	OrderedExcalidrawElement,
} from "@excalidraw/element/types";
import type {
	AppState,
	ExcalidrawImperativeAPI,
	BinaryFiles,
	ExcalidrawInitialDataState,
	UIAppState,
} from "@excalidraw/excalidraw/types";
import type { ResolutionType } from "@excalidraw/common/utility-types";
import type { ResolvablePromise } from "@excalidraw/common/utils";

import CustomStats from "./CustomStats";
import {
	Provider,
	useAtom,
	useAtomValue,
	useAtomWithInitialValue,
	appJotaiStore,
} from "./app-jotai";
import { STORAGE_KEYS, SYNC_BROWSER_TABS_TIMEOUT } from "./app_constants";
import { AppFooter } from "./components/AppFooter";
import { AppMainMenu } from "./components/AppMainMenu";
import { AppWelcomeScreen } from "./components/AppWelcomeScreen";
import { TopErrorBoundary } from "./components/TopErrorBoundary";

import { loadScene } from "./data";

import { updateStaleImageStatuses } from "./data/FileManager";
import { importFromLocalStorage } from "./data/localStorage";

import {
	LibraryIndexedDBAdapter,
	LibraryLocalStorageMigrationAdapter,
	LocalData,
	localStorageQuotaExceededAtom,
} from "./data/LocalData";
import { isBrowserStorageStateNewer } from "./data/tabSync";
import { useHandleAppTheme } from "./useHandleAppTheme";
import { getPreferredLanguage } from "./app-language/language-detector";
import { useAppLangCode } from "./app-language/language-state";
import DebugCanvas, {
	debugRenderer,
	isVisualDebuggerEnabled,
	loadSavedDebugState,
} from "./components/DebugCanvas";
import { AIComponents } from "./components/AI";
import { ChatOverlay } from "./components/ChatOverlay";

import "./index.scss";

polyfill();

window.EXCALIDRAW_THROTTLE_RENDER = true;

declare global {
	interface BeforeInstallPromptEventChoiceResult {
		outcome: "accepted" | "dismissed";
	}

	interface BeforeInstallPromptEvent extends Event {
		prompt(): Promise<void>;
		userChoice: Promise<BeforeInstallPromptEventChoiceResult>;
	}

	interface WindowEventMap {
		beforeinstallprompt: BeforeInstallPromptEvent;
	}
}

let pwaEvent: BeforeInstallPromptEvent | null = null;

// Adding a listener outside of the component as it may (?) need to be
// subscribed early to catch the event.
//
// Also note that it will fire only if certain heuristics are met (user has
// used the app for some time, etc.)
window.addEventListener(
	"beforeinstallprompt",
	(event: BeforeInstallPromptEvent) => {
		// prevent Chrome <= 67 from automatically showing the prompt
		event.preventDefault();
		// cache for later use
		pwaEvent = event;
	},
);

let isSelfEmbedding = false;

if (window.self !== window.top) {
	try {
		const parentUrl = new URL(document.referrer);
		const currentUrl = new URL(window.location.href);
		if (parentUrl.origin === currentUrl.origin) {
			isSelfEmbedding = true;
		}
	} catch {
		// ignore
	}
}

const initializeScene =
	async (): Promise<ExcalidrawInitialDataState | null> => {
		const externalUrlMatch = window.location.hash.match(/^#url=(.*)$/);
		const localDataState = importFromLocalStorage();

		const scene = await loadScene(null, null, localDataState);

		if (externalUrlMatch) {
			window.history.replaceState({}, APP_NAME, window.location.origin);

			const url = externalUrlMatch[1];
			try {
				const request = await fetch(window.decodeURIComponent(url));
				const data = await loadFromBlob(await request.blob(), null, null);
				return data;
			} catch {
				return {
					appState: {
						errorMessage: t("alerts.invalidSceneUrl"),
					},
				};
			}
		}

		return scene || null;
	};

const ExcalidrawWrapper = () => {
	const [errorMessage, setErrorMessage] = useState("");

	const { editorTheme, appTheme, setAppTheme } = useHandleAppTheme();

	const [langCode, setLangCode] = useAppLangCode();

	// initial state
	// ---------------------------------------------------------------------------

	const initialStatePromiseRef = useRef<{
		promise: ResolvablePromise<ExcalidrawInitialDataState | null>;
	}>({ promise: null! });
	if (!initialStatePromiseRef.current.promise) {
		initialStatePromiseRef.current.promise =
			resolvablePromise<ExcalidrawInitialDataState | null>();
	}

	const debugCanvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		trackEvent("load", "frame", getFrame());
		// Delayed so that the app has a time to load the latest SW
		setTimeout(() => {
			trackEvent("load", "version", getVersion());
		}, VERSION_TIMEOUT);
	}, []);

	const [excalidrawAPI, excalidrawRefCallback] =
		useCallbackRefState<ExcalidrawImperativeAPI>();

	useHandleLibrary({
		excalidrawAPI,
		adapter: LibraryIndexedDBAdapter,
		// TODO maybe remove this in several months (shipped: 24-03-11)
		migrationAdapter: LibraryLocalStorageMigrationAdapter,
	});

	const [, forceRefresh] = useState(false);

	useEffect(() => {
		if (isDevEnv()) {
			const debugState = loadSavedDebugState();

			if (debugState.enabled && !window.visualDebug) {
				window.visualDebug = {
					data: [],
				};
			} else {
				delete window.visualDebug;
			}
			forceRefresh((prev) => !prev);
		}
	}, []);

	useEffect(() => {
		if (!excalidrawAPI) {
			return;
		}

		const loadImages = (
			scene: ExcalidrawInitialDataState | null,
			isInitialLoad = false,
		) => {
			if (!scene) {
				return;
			}

			const fileIds =
				scene.elements?.reduce((acc, element) => {
					if (isInitializedImageElement(element)) {
						return acc.concat(element.fileId);
					}
					return acc;
				}, [] as FileId[]) || [];

			if (isInitialLoad) {
				if (fileIds.length) {
					LocalData.fileStorage
						.getFiles(fileIds)
						.then(({ loadedFiles, erroredFiles }) => {
							if (loadedFiles.length) {
								excalidrawAPI.addFiles(loadedFiles);
							}
							updateStaleImageStatuses({
								excalidrawAPI,
								erroredFiles,
								elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
							});
						});
				}
				// on fresh load, clear unused files from IDB (from previous session)
				LocalData.fileStorage.clearObsoleteFiles({ currentFileIds: fileIds });
			}
		};

		initializeScene().then(async (scene) => {
			loadImages(scene, /* isInitialLoad */ true);
			initialStatePromiseRef.current.promise.resolve(scene);
		});

		const onHashChange = async (event: HashChangeEvent) => {
			event.preventDefault();
			const libraryUrlTokens = parseLibraryTokensFromUrl();
			if (!libraryUrlTokens) {
				excalidrawAPI.updateScene({ appState: { isLoading: true } });

				initializeScene().then((scene) => {
					loadImages(scene);
					if (scene) {
						excalidrawAPI.updateScene({
							...scene,
							...restore(scene, null, null, { repairBindings: true }),
							captureUpdate: CaptureUpdateAction.IMMEDIATELY,
						});
					}
				});
			}
		};

		const syncData = debounce(() => {
			if (isTestEnv()) {
				return;
			}
			if (!document.hidden) {
				// don't sync if local state is newer or identical to browser state
				if (isBrowserStorageStateNewer(STORAGE_KEYS.VERSION_DATA_STATE)) {
					const localDataState = importFromLocalStorage();
					setLangCode(getPreferredLanguage());
					excalidrawAPI.updateScene({
						...localDataState,
						captureUpdate: CaptureUpdateAction.NEVER,
					});
					LibraryIndexedDBAdapter.load().then((data) => {
						if (data) {
							excalidrawAPI.updateLibrary({
								libraryItems: data.libraryItems,
							});
						}
					});
				}

				if (isBrowserStorageStateNewer(STORAGE_KEYS.VERSION_FILES)) {
					const elements = excalidrawAPI.getSceneElementsIncludingDeleted();
					const currFiles = excalidrawAPI.getFiles();
					const fileIds =
						elements?.reduce((acc, element) => {
							if (
								isInitializedImageElement(element) &&
								// only load and update images that aren't already loaded
								!currFiles[element.fileId]
							) {
								return acc.concat(element.fileId);
							}
							return acc;
						}, [] as FileId[]) || [];
					if (fileIds.length) {
						LocalData.fileStorage
							.getFiles(fileIds)
							.then(({ loadedFiles, erroredFiles }) => {
								if (loadedFiles.length) {
									excalidrawAPI.addFiles(loadedFiles);
								}
								updateStaleImageStatuses({
									excalidrawAPI,
									erroredFiles,
									elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
								});
							});
					}
				}
			}
		}, SYNC_BROWSER_TABS_TIMEOUT);

		const onUnload = () => {
			LocalData.flushSave();
		};

		const visibilityChange = (event: FocusEvent | Event) => {
			if (event.type === EVENT.BLUR || document.hidden) {
				LocalData.flushSave();
			}
			if (
				event.type === EVENT.VISIBILITY_CHANGE ||
				event.type === EVENT.FOCUS
			) {
				syncData();
			}
		};

		window.addEventListener(EVENT.HASHCHANGE, onHashChange, false);
		window.addEventListener(EVENT.UNLOAD, onUnload, false);
		window.addEventListener(EVENT.BLUR, visibilityChange, false);
		document.addEventListener(EVENT.VISIBILITY_CHANGE, visibilityChange, false);
		window.addEventListener(EVENT.FOCUS, visibilityChange, false);
		return () => {
			window.removeEventListener(EVENT.HASHCHANGE, onHashChange, false);
			window.removeEventListener(EVENT.UNLOAD, onUnload, false);
			window.removeEventListener(EVENT.BLUR, visibilityChange, false);
			window.removeEventListener(EVENT.FOCUS, visibilityChange, false);
			document.removeEventListener(
				EVENT.VISIBILITY_CHANGE,
				visibilityChange,
				false,
			);
		};
	}, [excalidrawAPI, setLangCode]);

	useEffect(() => {
		const unloadHandler = (event: BeforeUnloadEvent) => {
			LocalData.flushSave();

			if (
				excalidrawAPI &&
				LocalData.fileStorage.shouldPreventUnload(
					excalidrawAPI.getSceneElements(),
				)
			) {
				if (import.meta.env.VITE_APP_DISABLE_PREVENT_UNLOAD !== "true") {
					preventUnload(event);
				} else {
					console.warn(
						"preventing unload disabled (VITE_APP_DISABLE_PREVENT_UNLOAD)",
					);
				}
			}
		};
		window.addEventListener(EVENT.BEFORE_UNLOAD, unloadHandler);
		return () => {
			window.removeEventListener(EVENT.BEFORE_UNLOAD, unloadHandler);
		};
	}, [excalidrawAPI]);

	const onChange = (
		elements: readonly OrderedExcalidrawElement[],
		appState: AppState,
		files: BinaryFiles,
	) => {
		// this check is redundant, but since this is a hot path, it's best
		// not to evaludate the nested expression every time
		if (!LocalData.isSavePaused()) {
			LocalData.save(elements, appState, files, () => {
				if (excalidrawAPI) {
					let didChange = false;

					const elements = excalidrawAPI
						.getSceneElementsIncludingDeleted()
						.map((element) => {
							if (
								LocalData.fileStorage.shouldUpdateImageElementStatus(element)
							) {
								const newElement = newElementWith(element, { status: "saved" });
								if (newElement !== element) {
									didChange = true;
								}
								return newElement;
							}
							return element;
						});

					if (didChange) {
						excalidrawAPI.updateScene({
							elements,
							captureUpdate: CaptureUpdateAction.NEVER,
						});
					}
				}
			});
		}

		// Render the debug scene if the debug canvas is available
		if (debugCanvasRef.current && excalidrawAPI) {
			debugRenderer(
				debugCanvasRef.current,
				appState,
				window.devicePixelRatio,
				() => forceRefresh((prev) => !prev),
			);
		}
	};

	const renderCustomStats = (
		elements: readonly NonDeletedExcalidrawElement[],
		appState: UIAppState,
	) => {
		return (
			<CustomStats
				setToast={(message) => excalidrawAPI!.setToast({ message })}
				appState={appState}
				elements={elements}
			/>
		);
	};

	const localStorageQuotaExceeded = useAtomValue(localStorageQuotaExceededAtom);

	// browsers generally prevent infinite self-embedding, there are
	// cases where it still happens, and while we disallow self-embedding
	// by not whitelisting our own origin, this serves as an additional guard
	if (isSelfEmbedding) {
		return (
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					textAlign: "center",
					height: "100%",
				}}
			>
				<h1>I'm not a pretzel!</h1>
			</div>
		);
	}

	return (
		<div style={{ height: "100%" }} className="excalidraw-app">
			<Excalidraw
				excalidrawAPI={excalidrawRefCallback}
				onChange={onChange}
				initialData={initialStatePromiseRef.current.promise}
				UIOptions={{
					canvasActions: {
						toggleTheme: true,
					},
				}}
				langCode={langCode}
				renderCustomStats={renderCustomStats}
				detectScroll={false}
				handleKeyboardGlobally={true}
				autoFocus={true}
				theme={editorTheme}
				onLinkOpen={(element, event) => {
					if (element.link && isElementLink(element.link)) {
						event.preventDefault();
						excalidrawAPI?.scrollToContent(element.link, { animate: true });
					}
				}}
			>
				<AppMainMenu
					theme={appTheme}
					setTheme={(theme) => setAppTheme(theme)}
					refresh={() => forceRefresh((prev) => !prev)}
				/>
				{/* <AppWelcomeScreen /> */}
				<OverwriteConfirmDialog>
					<OverwriteConfirmDialog.Actions.ExportToImage />
					<OverwriteConfirmDialog.Actions.SaveToDisk />
				</OverwriteConfirmDialog>
				<AppFooter onChange={() => excalidrawAPI?.refresh()} />
				{excalidrawAPI && <AIComponents excalidrawAPI={excalidrawAPI} />}
				{excalidrawAPI && <ChatOverlay excalidrawAPI={excalidrawAPI} />}

				<TTDDialogTrigger />
				{localStorageQuotaExceeded && (
					<div className="alert alert--danger">
						{t("alerts.localStorageQuotaExceeded")}
					</div>
				)}

				{errorMessage && (
					<ErrorDialog onClose={() => setErrorMessage("")}>
						{errorMessage}
					</ErrorDialog>
				)}

				<CommandPalette
					customCommandPaletteItems={[
						{
							label: "GitHub",
							icon: GithubIcon,
							category: DEFAULT_CATEGORIES.links,
							predicate: true,
							keywords: [
								"issues",
								"bugs",
								"requests",
								"report",
								"features",
								"social",
								"community",
							],
							perform: () => {
								window.open(
									"https://github.com/excalidraw/excalidraw",
									"_blank",
									"noopener noreferrer",
								);
							},
						},
						{
							label: t("labels.followUs"),
							icon: XBrandIcon,
							category: DEFAULT_CATEGORIES.links,
							predicate: true,
							keywords: ["twitter", "contact", "social", "community"],
							perform: () => {
								window.open(
									"https://x.com/excalidraw",
									"_blank",
									"noopener noreferrer",
								);
							},
						},
						{
							label: t("labels.discordChat"),
							category: DEFAULT_CATEGORIES.links,
							predicate: true,
							icon: DiscordIcon,
							keywords: [
								"chat",
								"talk",
								"contact",
								"bugs",
								"requests",
								"report",
								"feedback",
								"suggestions",
								"social",
								"community",
							],
							perform: () => {
								window.open(
									"https://discord.gg/UexuTaE",
									"_blank",
									"noopener noreferrer",
								);
							},
						},
						{
							label: "YouTube",
							icon: youtubeIcon,
							category: DEFAULT_CATEGORIES.links,
							predicate: true,
							keywords: ["features", "tutorials", "howto", "help", "community"],
							perform: () => {
								window.open(
									"https://youtube.com/@excalidraw",
									"_blank",
									"noopener noreferrer",
								);
							},
						},
						{
							...CommandPalette.defaultItems.toggleTheme,
							perform: () => {
								setAppTheme(
									editorTheme === THEME.DARK ? THEME.LIGHT : THEME.DARK,
								);
							},
						},
						{
							label: t("labels.installPWA"),
							category: DEFAULT_CATEGORIES.app,
							predicate: () => !!pwaEvent,
							perform: () => {
								if (pwaEvent) {
									pwaEvent.prompt();
									pwaEvent.userChoice.then(() => {
										// event cannot be reused, but we'll hopefully
										// grab new one as the event should be fired again
										pwaEvent = null;
									});
								}
							},
						},
					]}
				/>
				{isVisualDebuggerEnabled() && excalidrawAPI && (
					<DebugCanvas
						appState={excalidrawAPI.getAppState()}
						scale={window.devicePixelRatio}
						ref={debugCanvasRef}
					/>
				)}
			</Excalidraw>
		</div>
	);
};

const ExcalidrawApp = () => {
	return (
		<TopErrorBoundary>
			<Provider store={appJotaiStore}>
				<ExcalidrawWrapper />
			</Provider>
		</TopErrorBoundary>
	);
};

export default ExcalidrawApp;
