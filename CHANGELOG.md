# [2.36.0](https://github.com/lung-interactive/sg-server/compare/v2.35.2...v2.36.0) (2026-04-24)


### Bug Fixes

* **app-admin-panel:** route launcher version navigation through SG prefix ([45ab291](https://github.com/lung-interactive/sg-server/commit/45ab2913e42980d72384d1ffe69ca74f88fd0833))
* **app-admin-panel:** route SG game navigation to /app/sg paths ([91cb6ba](https://github.com/lung-interactive/sg-server/commit/91cb6bab707cde44f0b70ed1e3d8c55b39a1f3c7))
* **test:** provide ConfigService in auth send-login-code e2e module ([0a1c9f7](https://github.com/lung-interactive/sg-server/commit/0a1c9f73dd465de578e09bf865a6252f1ad93be7))


### Features

* **auth:** gate Twitch OAuth routes when provider is not configured ([250bcfc](https://github.com/lung-interactive/sg-server/commit/250bcfc1ab727cfb145679bc83185a79e9591739))
* **export:** remove SG test suites from HMS snapshot extraction ([de03e27](https://github.com/lung-interactive/sg-server/commit/de03e27f8a2049aabad93b00678645779c50e122))

## [2.35.2](https://github.com/lung-interactive/sg-server/compare/v2.35.1...v2.35.2) (2026-04-24)


### Bug Fixes

* **ci:** replace app-admin-panel npm ci with npm install in snapshot validation ([a520722](https://github.com/lung-interactive/sg-server/commit/a520722993d4dc193f5d7880fb9d05e708741c87))
* **ci:** restore npm ci for app-admin-panel snapshot validation ([10074bf](https://github.com/lung-interactive/sg-server/commit/10074bf6481dc569c86bfbf11314b160968cafe0))

## [2.35.1](https://github.com/lung-interactive/sg-server/compare/v2.35.0...v2.35.1) (2026-04-24)


### Bug Fixes

* **ci:** use default github token for semantic release authentication ([33869e5](https://github.com/lung-interactive/sg-server/commit/33869e5e51681445201496733fb02a255058cf69))

# [2.35.0](https://github.com/lung-interactive/sg-server/compare/v2.34.1...v2.35.0) (2026-04-24)


### Bug Fixes

* **app-api:** add missing purge use case provider in games backoffice e2e test ([bf15fa7](https://github.com/lung-interactive/sg-server/commit/bf15fa729499dedc31fe79df4852c623b6bfa9fb))


### Features

* **app-admin-panel:** add danger zone purge UI with typed confirmation ([ef5e7e4](https://github.com/lung-interactive/sg-server/commit/ef5e7e4e75f81e0eea9e684281f9a9edd03af192))
* **app-admin-panel:** add version init settings dialog with shared dark json editor ([73e0bd0](https://github.com/lung-interactive/sg-server/commit/73e0bd0c190ca594e376200cab95db8391de03fd))
* **app-admin-panel:** implement init settings editor with reorderable page tabs ([e03fc1f](https://github.com/lung-interactive/sg-server/commit/e03fc1f84d7031dacfb310b3a04951cb547052de))
* **app-api:** add asynchronous game purge workflow and backoffice endpoint ([b92c708](https://github.com/lung-interactive/sg-server/commit/b92c7084cd35186b9d30b44fd0a42881a0e8cc1e))
* **app-api:** add runtime init settings endpoints and use cases ([0bce4c7](https://github.com/lung-interactive/sg-server/commit/0bce4c78a3dea38d9ca7abd5c6783a061354c266))
* **app-api:** centralize SG game availability state changes and fan-out events ([a1c3192](https://github.com/lung-interactive/sg-server/commit/a1c3192c86ccb90b52afe1a71d6ce78957e0ae51))
* **ci:** automate HMS export snapshot on tag and PR creation ([338bdda](https://github.com/lung-interactive/sg-server/commit/338bddabec8cbdd830a2cd977406a86c85f6d3ce))
* **ci:** validate HMS snapshot admin build after SG stripping ([f396d23](https://github.com/lung-interactive/sg-server/commit/f396d23f261f591a485fd7660648a50b1eb92467))
* **games:** return image status in successful public response ([a9eae15](https://github.com/lung-interactive/sg-server/commit/a9eae15a89640ee0dbfde828032f86375fad0bc9))

## [2.34.1](https://github.com/lung-interactive/sg-server/compare/v2.34.0...v2.34.1) (2026-04-17)


### Bug Fixes

* **app-api:** sync launcher i18n keys and pt-BR spotlight naming ([127d1f9](https://github.com/lung-interactive/sg-server/commit/127d1f9f3104553c119b0d68ae1f4b3a205f5069))

# [2.34.0](https://github.com/lung-interactive/sg-server/compare/v2.33.5...v2.34.0) (2026-04-17)


### Bug Fixes

* **app-admin-panel:** normalize prerelease display with .0 fallback ([5d25bce](https://github.com/lung-interactive/sg-server/commit/5d25bce86b89717c0915ff6198d1826562c4f763))


### Features

* **app-admin-panel:** support numbered prerelease in semantic version input ([d3e8712](https://github.com/lung-interactive/sg-server/commit/d3e871253edfb89d6aedc83a0a8c071d7272c72e))
* **app-api:** add complete pt-BR translations for launcher i18n ([08ede16](https://github.com/lung-interactive/sg-server/commit/08ede16196c9cd7f6ea3feaec7929fe7bf050848))
* **app-api:** expand launcher i18n namespaces and english resources ([324d53b](https://github.com/lung-interactive/sg-server/commit/324d53bf713ee6d0156cfc297917cb22079a68c0))

## [2.33.5](https://github.com/lung-interactive/sg-server/compare/v2.33.4...v2.33.5) (2026-04-16)


### Bug Fixes

* **app-admin-panel:** remove client-side system-status request blocking ([6797f07](https://github.com/lung-interactive/sg-server/commit/6797f077d5051dac2c97ff4565d34d5749da8af5))

## [2.33.4](https://github.com/lung-interactive/sg-server/compare/v2.33.3...v2.33.4) (2026-04-16)


### Bug Fixes

* **app-api:** recognize @Backoffice metadata during maintenance ([bdc7f26](https://github.com/lung-interactive/sg-server/commit/bdc7f268fc35919e4a4f2db83556642da0c833cb))

## [2.33.3](https://github.com/lung-interactive/sg-server/compare/v2.33.2...v2.33.3) (2026-04-16)


### Bug Fixes

* **app-api:** make launcher page pagination deterministic ([d0a334f](https://github.com/lung-interactive/sg-server/commit/d0a334f3d25cbfa9ef4b7b7ca93f9e79b087368a))

## [2.33.2](https://github.com/lung-interactive/sg-server/compare/v2.33.1...v2.33.2) (2026-04-15)


### Bug Fixes

* **app-api:** allow health probes during maintenance ([4fe8a82](https://github.com/lung-interactive/sg-server/commit/4fe8a826fc87b2ef81566d22b10ece1b548b1c4b))

## [2.33.1](https://github.com/lung-interactive/sg-server/compare/v2.33.0...v2.33.1) (2026-04-15)


### Bug Fixes

* **app-admin-panel:** stabilize system realtime socket connection ([6e12aaa](https://github.com/lung-interactive/sg-server/commit/6e12aaad959a5482f133c286ee7b03d6dba09460))

# [2.33.0](https://github.com/lung-interactive/sg-server/compare/v2.32.0...v2.33.0) (2026-04-15)


### Features

* **app-api:** allow backoffice routes during maintenance ([02d767f](https://github.com/lung-interactive/sg-server/commit/02d767f8437e1743554b457c620842c9d874a3b4))

# [2.32.0](https://github.com/lung-interactive/sg-server/compare/v2.31.0...v2.32.0) (2026-04-15)


### Bug Fixes

* **launcher-backoffice:** promote channel manifests from candidate on publish ([cb6a291](https://github.com/lung-interactive/sg-server/commit/cb6a291c4cd62463a058b259a65033497371775f))


### Features

* **launcher-public:** add semver-based end-user changelog endpoint ([1eca733](https://github.com/lung-interactive/sg-server/commit/1eca7330b4c00b98ccc8df1552d4bf7da60048f8))

# [2.31.0](https://github.com/lung-interactive/sg-server/compare/v2.30.0...v2.31.0) (2026-04-15)


### Features

* **app-admin-panel:** add launcher candidate release actions in detail view ([5f86148](https://github.com/lung-interactive/sg-server/commit/5f86148eebc7ba1e175795a3b50c8ea829bf325b))
* **database-seeding:** support repeatable seeds after initial setup ([588329e](https://github.com/lung-interactive/sg-server/commit/588329ecef392932e7feb60fdff11a3dd261fa73))
* **dev-seed:** align launcher candidate seed artifacts with pipeline layout ([379d182](https://github.com/lung-interactive/sg-server/commit/379d1824571d84a5deb0504af360610b3d1ffbca))
* **launcher-backoffice:** add candidate release workflows for updater and installers-only ([fba8e9b](https://github.com/lung-interactive/sg-server/commit/fba8e9bcaf236a6c0da52fe7fa63c2446fd71877))

# [2.30.0](https://github.com/lung-interactive/sg-server/compare/v2.29.1...v2.30.0) (2026-04-15)


### Bug Fixes

* **admin-panel:** treat falsy api response data as valid payloads ([cdbb20b](https://github.com/lung-interactive/sg-server/commit/cdbb20bc72b2e2d5834705993af728bbdea560f0))


### Features

* **admin-panel:** add launcher version detail page and list navigation ([6a6af4d](https://github.com/lung-interactive/sg-server/commit/6a6af4d6bfb425dc3ea7d70dd7ad8a576ef2fa37))
* **admin-panel:** add launcher versions list page and navigation ([16ac1b0](https://github.com/lung-interactive/sg-server/commit/16ac1b07425dd5bf38d66c8652f7322d5731d9d2))
* **admin-panel:** add tabbed launcher detail with markdown changelog editor ([dc4348a](https://github.com/lung-interactive/sg-server/commit/dc4348a00eddbb28a7bf97407df8a9f144b6362c))
* **launcher-backoffice:** add artifact download and end-user changelog update APIs ([4d258ef](https://github.com/lung-interactive/sg-server/commit/4d258efbe417ab7ecdb04cb7d553c8a05f2fa991))
* **launcher-backoffice:** add launcher version by-id endpoints ([37a3487](https://github.com/lung-interactive/sg-server/commit/37a34876105628a52df330c77e385b37182f487e))
* **launcher-backoffice:** add paginated launcher versions listing API ([bc4fd5e](https://github.com/lung-interactive/sg-server/commit/bc4fd5e8f0db1debcb5fe6b8dc7e749a2e65fb08))

## [2.29.1](https://github.com/lung-interactive/sg-server/compare/v2.29.0...v2.29.1) (2026-04-14)


### Bug Fixes

* **app-system:** keep maintenance reports internal and suppress restart noise ([c1b78bd](https://github.com/lung-interactive/sg-server/commit/c1b78bdf2c6deeddde2c430a10dd1d4e9266ede3))

# [2.29.0](https://github.com/lung-interactive/sg-server/compare/v2.28.0...v2.29.0) (2026-04-14)


### Features

* **launcher:** split launcher endpoints into public, development and backoffice modules ([e4f5499](https://github.com/lung-interactive/sg-server/commit/e4f54993ed7ab8897a07fc4534f4dacafb24d995))

# [2.28.0](https://github.com/lung-interactive/sg-server/compare/v2.27.2...v2.28.0) (2026-04-14)


### Bug Fixes

* **app-api:** publish API readiness state during init lifecycle ([20de38e](https://github.com/lung-interactive/sg-server/commit/20de38e71a476a6bb4ebc4401fd3a6c0861a22dd))
* **app-api:** render released game versions using semver strings in init report ([2ef2da7](https://github.com/lung-interactive/sg-server/commit/2ef2da76431e2a374e682bb30a3b29f77ae191cd))
* **app-system:** harden maintenance state restoration and release gating ([7911177](https://github.com/lung-interactive/sg-server/commit/7911177f6f5df308ed41d60ba7fc7ecb4da10c4e))
* **maintenance:** keep Redis untouched during maintenance rollout ([1e1508c](https://github.com/lung-interactive/sg-server/commit/1e1508cb56f48e68562386d6cb93ad7ce3d1c977))
* **shared-types:** correct GameVersionState import paths ([94719c5](https://github.com/lung-interactive/sg-server/commit/94719c55b9727c3e3ec0d0b0ef89e9547c710667))


### Features

* **app-api:** persist maintenance-scoped init reports with incremental merge ([724462c](https://github.com/lung-interactive/sg-server/commit/724462c2c6675e08666cd0fdd3b23968365da108))
* **app-system:** separate public status updates from internal maintenance reports ([ab9b759](https://github.com/lung-interactive/sg-server/commit/ab9b759c4f55ecd576de6a58ca63f55cb70ea07b))
* **launcher:** add candidate version registration endpoint for CI/CD ([6d534e8](https://github.com/lung-interactive/sg-server/commit/6d534e899958472d5bdd7e9f418e103e91a3d783))

## [2.27.2](https://github.com/lung-interactive/sg-server/compare/v2.27.1...v2.27.2) (2026-04-12)


### Bug Fixes

* **docker:** add stack readiness gate for admin panel health ([511b604](https://github.com/lung-interactive/sg-server/commit/511b604a6aa459d60f0084927556fdc6fd3904e0))

## [2.27.1](https://github.com/lung-interactive/sg-server/compare/v2.27.0...v2.27.1) (2026-04-12)


### Bug Fixes

* **docker:** ignore node_modules in Docker build context ([27d6d45](https://github.com/lung-interactive/sg-server/commit/27d6d458fd242a3ec8e193872a5b126fd8993646))

# [2.27.0](https://github.com/lung-interactive/sg-server/compare/v2.26.0...v2.27.0) (2026-04-12)


### Features

* **profile-sync:** sync Twitch avatar and emit realtime profile updates ([b6b74c7](https://github.com/lung-interactive/sg-server/commit/b6b74c7b262f632eacd2042ce72b46bd27a5596a))

# [2.26.0](https://github.com/lung-interactive/sg-server/compare/v2.25.0...v2.26.0) (2026-04-11)


### Features

* **auth:** support term-based send-login-code flow ([8ccff62](https://github.com/lung-interactive/sg-server/commit/8ccff626053b4424b702bdfbd1bcd061524fcdb1))
* **games-runtime:** add explicit homologation-access endpoint ([9a28675](https://github.com/lung-interactive/sg-server/commit/9a28675411c65f4b9c8b1b90c6aa0e36c2612d4a))

# [2.25.0](https://github.com/lung-interactive/sg-server/compare/v2.24.2...v2.25.0) (2026-04-07)


### Features

* **db:** add SG profiles migration and entity + repository ([164033e](https://github.com/lung-interactive/sg-server/commit/164033ec05be7e2592e502851e38e1399c6dfe28))
* **profiles:** inject UsersRepository and create profile when missing ([f225891](https://github.com/lung-interactive/sg-server/commit/f2258919029088e86b763960548ffa20a29b8ef4))
* **profiles:** register UsersModule and MediaModule in ProfilesModule ([b39d6fc](https://github.com/lung-interactive/sg-server/commit/b39d6fc894fc399587f12de0be656a618201cb1e))
* **profiles:** require name in UpdateProfileDto ([a122801](https://github.com/lung-interactive/sg-server/commit/a12280192740c4c6c9496d14b6cf1562e970d1f7))
* **scripts:** add restart-admin-panel.sh helper ([d3588d5](https://github.com/lung-interactive/sg-server/commit/d3588d5193c10e4ccf58dd10d90214fbae74924f))

## [2.24.2](https://github.com/lung-interactive/sg-server/compare/v2.24.1...v2.24.2) (2026-04-06)


### Bug Fixes

* **versions:** create mapping FormArrays and guard child editors ([fa2477a](https://github.com/lung-interactive/sg-server/commit/fa2477ae45feecea5099eb37a7fdf58c826e254d))

## [2.24.1](https://github.com/lung-interactive/sg-server/compare/v2.24.0...v2.24.1) (2026-04-06)


### Bug Fixes

* **hms/profiles:** remove Twitch dependency from profiles/me and resolve profile picture via MediaService ([8e509a0](https://github.com/lung-interactive/sg-server/commit/8e509a0e5bdba16e97a3a0adc132f56e209a162a))
* **versions:** avoid passing undefined FormArray to child editors and normalize trigger conditions ([08ed69f](https://github.com/lung-interactive/sg-server/commit/08ed69f4288040ddc893498a47dd26bbec069d59))

# [2.24.0](https://github.com/lung-interactive/sg-server/compare/v2.23.0...v2.24.0) (2026-04-06)


### Features

* **hms/auth:** implement end-user login code flow ([db5f49c](https://github.com/lung-interactive/sg-server/commit/db5f49c1fcffbfe215f594c94b307c9723911023))
* **sg:** add is_active flag to StreamerConnection ([732c4fe](https://github.com/lung-interactive/sg-server/commit/732c4fecdfbb68f85a0aa430ff479c2dc6bf1436))
* **sg:** add StreamerConnection repository and register in SGCoreModule ([7daeb73](https://github.com/lung-interactive/sg-server/commit/7daeb73619f3e0d870d5981095d0b8c780637efa))
* **streamers:** add activation endpoints for StreamerConnection ([30305bd](https://github.com/lung-interactive/sg-server/commit/30305bdd64d888d262448e94180d85e7a9297718))
* **versions:** add delete action button and removal logic for crowd actions ([300e201](https://github.com/lung-interactive/sg-server/commit/300e201284824ac1ac34079245b6176314e16561))

# [2.23.0](https://github.com/lung-interactive/sg-server/compare/v2.22.1...v2.23.0) (2026-04-05)


### Bug Fixes

* **i18n:** accept nested object bundles and preserve object format ([3a7d949](https://github.com/lung-interactive/sg-server/commit/3a7d9493b22c9b374ba12a7063131b1042456b90))


### Features

* **i18n:** add launcher translations for en and pt-BR ([3dedd83](https://github.com/lung-interactive/sg-server/commit/3dedd83a79ae5c58ec15b33a855f40e2ad44c0db))

## [2.22.1](https://github.com/lung-interactive/sg-server/compare/v2.22.0...v2.22.1) (2026-04-05)


### Bug Fixes

* **i18n:** ensure i18n endpoints return API envelope via responser.data ([dcb5c97](https://github.com/lung-interactive/sg-server/commit/dcb5c9731152f63afc1c6937496c5610e47ca1ee))

# [2.22.0](https://github.com/lung-interactive/sg-server/compare/v2.21.0...v2.22.0) (2026-04-05)


### Features

* **app-api:** centralize HMS i18n API and filesystem support ([8debcbe](https://github.com/lung-interactive/sg-server/commit/8debcbe5a893687f2745b281be69a9ae5e1c47c0))

# [2.21.0](https://github.com/lung-interactive/sg-server/compare/v2.20.0...v2.21.0) (2026-04-04)


### Bug Fixes

* **app-admin-panel:** make refresh flow resilient on concurrent 401 errors ([111d8a2](https://github.com/lung-interactive/sg-server/commit/111d8a2af2aa7ab30df57613b1cdb859185e6336))
* **app-api:** preserve device context during refresh rotation ([9d0e8f6](https://github.com/lung-interactive/sg-server/commit/9d0e8f692ce51bc5ce0d9b95f2f8960acd1395ec))
* **scripts:** ensure api service is fully stopped before maintenance build ([40251bd](https://github.com/lung-interactive/sg-server/commit/40251bd89044953d1e830a81a414129a25a9b9e3))


### Features

* **app-admin-panel:** add shared game availability editor to game edit page ([f2fe85b](https://github.com/lung-interactive/sg-server/commit/f2fe85b598dfc860b598a6ffe084670dd4ae30fc))
* **app-api:** allow backoffice game availability updates ([3537f8a](https://github.com/lung-interactive/sg-server/commit/3537f8a55bc428e6e2b29d2d15aab234aa132f17))

# [2.20.0](https://github.com/lung-interactive/sg-server/compare/v2.19.1...v2.20.0) (2026-04-04)


### Bug Fixes

* **app-api:** return 401 for invalid or expired jwt signatures ([9d13e0d](https://github.com/lung-interactive/sg-server/commit/9d13e0d4c9910944a23e036871d3451d934991b2))


### Features

* **app-api:** add backoffice endpoint to fetch version platforms ([ad54aab](https://github.com/lung-interactive/sg-server/commit/ad54aab64e9595ce56dda142a0d8d598a1f3e006))
* **app-api:** include optional semantic code in standardized error payload ([25f441a](https://github.com/lung-interactive/sg-server/commit/25f441a916ce79bbeff8a9e29fd4a20430e35f74))

## [2.19.1](https://github.com/lung-interactive/sg-server/compare/v2.19.0...v2.19.1) (2026-04-04)


### Bug Fixes

* **app-api:** accept and persist crowd argument default values in backoffice updates ([d870ae6](https://github.com/lung-interactive/sg-server/commit/d870ae61bf653a85ba161052d396f5a2d2f8210d))

# [2.19.0](https://github.com/lung-interactive/sg-server/compare/v2.18.0...v2.19.0) (2026-04-03)


### Bug Fixes

* **app-admin-panel:** suppress global interceptor alerts for expected game-image misses ([339aa60](https://github.com/lung-interactive/sg-server/commit/339aa603f3d0c8b367df250a4f5666394363233b))
* **use-cases:** remove replaced legacy use-cases ([aaeba0d](https://github.com/lung-interactive/sg-server/commit/aaeba0d0b9cc13714e6778499d04ecc04b6f547e))


### Features

* **app-admin-panel:** add reusable game image slot flow with upload/remove integration ([aa7ab2d](https://github.com/lung-interactive/sg-server/commit/aa7ab2dda6211d1bf10ead33a4bd76b337c577fc))
* **app-admin-panel:** add shared game image component and migrate game screens ([0ced083](https://github.com/lung-interactive/sg-server/commit/0ced083693aea49924a7cc3978036cba11c839c2))
* **app-api:** add backoffice game-image removal endpoint and harden image key/url handling ([24e393e](https://github.com/lung-interactive/sg-server/commit/24e393ec532219afd052e4692287c2293fe86fe5))
* **app-api:** make dev game seeds deterministic and add seeded wide image media ([44fefee](https://github.com/lung-interactive/sg-server/commit/44fefeec1cb78fffbe1b3e25adf5ce012c569286))
* **crowd-actions:** update backoffice crowd-actions use-case and facade ([5225205](https://github.com/lung-interactive/sg-server/commit/522520536678e168e6fee40b320c4e60619bd452))
* **games-backoffice:** add server-only UploadGameImageParams and update use-case ([c0618ed](https://github.com/lung-interactive/sg-server/commit/c0618ed9f740f960d1b7831df6f6b964b6d99693))
* **image-handling:** accept AVIF in dropzone and return AVIF crop ([3e0ee1f](https://github.com/lung-interactive/sg-server/commit/3e0ee1feed0501bcc753380dc52893f91e556b3d))
* **images:** add images view, portrait cropper and crop dialog ([0f9ba94](https://github.com/lung-interactive/sg-server/commit/0f9ba9421e9143d7b8326f2a36a40af9c197a4ae))
* **images:** implement game image upload flow and admin integration ([d9c281a](https://github.com/lung-interactive/sg-server/commit/d9c281a15cb001787380401d1cbe141618d0a290))
* **public:** add/adjust public DTOs for runtime and crowd actions ([5b4ac1e](https://github.com/lung-interactive/sg-server/commit/5b4ac1ee2a554e4f021d3a1c2d7b4f1771c7e882))
* **runtime:** add get-version-runtime usecase ([3468989](https://github.com/lung-interactive/sg-server/commit/34689899a9b057f0669640fc68946457e376998a))
* **runtime:** add runtime module, controller, facades and use-cases ([275249e](https://github.com/lung-interactive/sg-server/commit/275249eb0266ec7b85514a4c1086962a58772e03))
* **shared-types:** make UploadGameImageParams browser-safe ([92f1608](https://github.com/lung-interactive/sg-server/commit/92f1608137ccf1cfb2bfadaa104454340c0aef5a))

# [2.18.0](https://github.com/lung-interactive/sg-server/compare/v2.17.0...v2.18.0) (2026-04-01)


### Bug Fixes

* **admin-panel:** hook ArgumentEditor into VersionsModule and dialog integration ([31154e6](https://github.com/lung-interactive/sg-server/commit/31154e694192d0f70fd366b63f3772545bf4f9c5))
* **api:** accept optional conditions object in crowd trigger DTO ([787f5dd](https://github.com/lung-interactive/sg-server/commit/787f5dd5d1f778be75bdab45071bef449a66052c))
* **api:** align DTOs and use-case validation for CrowdAction argument types ([ea5a5b6](https://github.com/lung-interactive/sg-server/commit/ea5a5b62e58703ee12e9b0e1393d90e001ff8d77))
* **crowd-actions:** close parse error and update mappings/tests for removed command args\n\nFix missing brace in update-version-crowd.usecase.ts and update mappings usecase + tests to reflect commands no longer carry args. ([96964ce](https://github.com/lung-interactive/sg-server/commit/96964cefe7b6e9af9b3a4e592d626af848a7fd2d))
* **sg:** ensure creator is propagated when creating management tokens ([9adb269](https://github.com/lung-interactive/sg-server/commit/9adb269b3389d0c81ce57b01aa6f7a82f8dcd9bf))
* **versions:** persist mapping edits when switching action tabs ([1e70c33](https://github.com/lung-interactive/sg-server/commit/1e70c3351e260afed228a7cdd641b6b4da0c8b4e))


### Features

* **admin-panel:** add mappings editors and JSON validation for trigger conditions ([db73e7f](https://github.com/lung-interactive/sg-server/commit/db73e7fe83498bf5cfd521ff9f0e020f185d2702))
* **admin-panel:** improve management tokens list layout and copy action ([28f55f8](https://github.com/lung-interactive/sg-server/commit/28f55f886fd0c5570356bef36964400066846e0b))
* **admin-panel:** prevent dialog backdrop/ESC close when form dirty ([0c51e82](https://github.com/lung-interactive/sg-server/commit/0c51e82e16aecc9f2af9b14b0022980284f8d7cf))
* **admin-panel:** refine chat command editor layout and hide aliases ([f9320b6](https://github.com/lung-interactive/sg-server/commit/f9320b60737ab255c18c71cf289c1958614abd49))
* **admin-panel:** refine trigger editor layout and hide conditions ([3c878ea](https://github.com/lung-interactive/sg-server/commit/3c878eac7574321495034e303bfd39b3af581c83))
* **admin-panel:** sync FormArray edits and normalize command aliases/args ([d709cab](https://github.com/lung-interactive/sg-server/commit/d709cab34418e92139d46fe18153960d1e1818c6))
* **admin-panel:** update triggers/commands help text and fix message-box overflow ([05b65cd](https://github.com/lung-interactive/sg-server/commit/05b65cd8ec760f3d432b80fb35a58c02ac372956))
* **admin-panel:** use project tab/template syntax for action dialog ([2040833](https://github.com/lung-interactive/sg-server/commit/2040833ffd533c2fbfff6f39438164afe756cfac))
* **api:** add atomic crowd update endpoint and use-case with tests ([a0a3dc0](https://github.com/lung-interactive/sg-server/commit/a0a3dc06e0f929d105b89cc5bb8473711e6209bb))
* **api:** update GamesBackoffice controller imports and validations ([36d6b0d](https://github.com/lung-interactive/sg-server/commit/36d6b0ddca3b8732f429f379b85f8bcc39a9077e))
* **crowd-actions:** add action subviews (details + mappings) and icons ([f7f7960](https://github.com/lung-interactive/sg-server/commit/f7f7960a419eb238a4ca72c513a7d07f49ec6fdc))
* **versions:** add Action Mappings UI (Triggers & Commands) and wire editors ([ee94797](https://github.com/lung-interactive/sg-server/commit/ee94797af63a13b829f71150dc27736c8c05a7b4))
* **versions:** add interactive Argument editor component and UI behaviors ([a24f058](https://github.com/lung-interactive/sg-server/commit/a24f058f5e8ddd99f08c528d9c9ac9339d45f24b))
* **versions:** add TriggerEditor and ChatCommandEditor components ([6bd116b](https://github.com/lung-interactive/sg-server/commit/6bd116b9a7647b73051d658abb7ff7207c10bbe9))
* **versions:** map default_value when sending/receiving crowd action args ([5eb4994](https://github.com/lung-interactive/sg-server/commit/5eb49941bd9d0738308030cd7abd302889773cd1))
* **versions:** map default_value when sending/receiving crowd action args ([ceba6b5](https://github.com/lung-interactive/sg-server/commit/ceba6b556aae16192e0a8e1c33d21f36e665ce04))

# [2.17.0](https://github.com/lung-interactive/sg-server/compare/v2.16.1...v2.17.0) (2026-03-31)


### Bug Fixes

* **admin-panel:** copy browser build to nginx root and use npm install ([d9cf1f0](https://github.com/lung-interactive/sg-server/commit/d9cf1f043978bacc87bb67599f1d433276dfcee5))


### Features

* **maintenance:** add --skip-pull and --skip-tests flags; fix git pull logic ([2cae763](https://github.com/lung-interactive/sg-server/commit/2cae763a2dc257ee72e90e26958f3a88e2d272a0))

## [2.16.1](https://github.com/lung-interactive/sg-server/compare/v2.16.0...v2.16.1) (2026-03-31)


### Bug Fixes

* **crowd:** remove twitch-message triggers from example mappings ([ba6d515](https://github.com/lung-interactive/sg-server/commit/ba6d5154e855842f9f696416db2653f777cc81ea))

# [2.16.0](https://github.com/lung-interactive/sg-server/compare/v2.15.0...v2.16.0) (2026-03-31)


### Bug Fixes

* **crowd:** add identifiers to example actions and document mapping linkage ([2462dee](https://github.com/lung-interactive/sg-server/commit/2462dee763e22f3e577d227d61da5941c30ea526))
* **docs:** correct repository-root links in crowd actions guide ([23eecf4](https://github.com/lung-interactive/sg-server/commit/23eecf425bf9a121045317c0385f6bab85353723))


### Features

* **admin-panel/games:** remove platforms from create form and use backoffice GET\n\nRemoves platform controls from the create UI, updates payload, and switches edit view to use backoffice get. ([0fd1826](https://github.com/lung-interactive/sg-server/commit/0fd182677ec2696a1e3f80ee0771d170d37a8582))
* **api/backoffice:** add GET /backoffice/games/:id endpoint and e2e test\n\nAdds the backoffice controller route that returns a single game by id and an E2E spec exercising it. ([19016bf](https://github.com/lung-interactive/sg-server/commit/19016bf0305624d46fc4fabe20992ef50992fdcf))
* **crowd:** add example scenarios and JSON templates ([43d1266](https://github.com/lung-interactive/sg-server/commit/43d126690ac68b1af3979bb59b7a2fac37c703c2))
* **shared-types:** add game payload and filters types\n\nAdds shared TypeScript definitions used by admin and API. ([d300184](https://github.com/lung-interactive/sg-server/commit/d300184ff3c62ff55058bf2b20e35732886ea35d))

# [2.15.0](https://github.com/lung-interactive/sg-server/compare/v2.14.0...v2.15.0) (2026-03-30)


### Bug Fixes

* **admin:** adjust games components for metadata changes ([12f5112](https://github.com/lung-interactive/sg-server/commit/12f5112378beb4176b30d48fbc63baf3dfe1f141))
* **crowd-actions:** adjust crowd actions use-cases and tests ([3736198](https://github.com/lung-interactive/sg-server/commit/3736198f9bef557516cc4484aabaedce75d32f64))
* **public:** update public games service and e2e specs ([54cd3f3](https://github.com/lung-interactive/sg-server/commit/54cd3f324767f70e1b2e18b5761ca4ee23841a67))
* **tests:** update get-version-metadata unit spec ([b50acaa](https://github.com/lung-interactive/sg-server/commit/b50acaa75e120d7a051faa9b0a267c7bd10d689b))


### Features

* **admin-panel:** migrate platforms UI to version-scoped dialog and view ([17ed076](https://github.com/lung-interactive/sg-server/commit/17ed07604ed784a694db09a77ae97ff950d2cb9d))
* **api:** add endpoints and use-cases for version runtime platforms ([308f009](https://github.com/lung-interactive/sg-server/commit/308f0096610d4816dba06903784b206c33ec1970))
* **games:** remove supported_modules relation and simplify game creation API ([52039a7](https://github.com/lung-interactive/sg-server/commit/52039a79ffc0406b5cd1be87cac7d54286f00535))
* **migrations:** add guarded metadata split and drop supported_modules join table ([34c883e](https://github.com/lung-interactive/sg-server/commit/34c883e27b06d025710846543c00700edfb32893))
* **migrations:** add migration to remove sg_crowd_actions ([d9f18a3](https://github.com/lung-interactive/sg-server/commit/d9f18a3cde52641135cda1a80ec732eb76bc81aa))
* **sg/launcher:** add admin controller and module registration ([682bf3b](https://github.com/lung-interactive/sg-server/commit/682bf3b3b93250c2960cb498a4dbf1de6e295c06))
* **sg/launcher:** add game event gateway and service ([2dce032](https://github.com/lung-interactive/sg-server/commit/2dce032ac9fa817103c66d7115d740c20da23f4d))
* **sg:** convert ConnectionPlatform to string enum and update metadata handling ([ef616d4](https://github.com/lung-interactive/sg-server/commit/ef616d4651f08bb0f36e7ce2a707a4cc65c4ebb4))
* **sg:** move crowd actions into version metadata ([a37efcd](https://github.com/lung-interactive/sg-server/commit/a37efcdab1e0c27e8d0d66353b95cab9639ced66))
* **versioning:** add PlatformChips composite (ControlValueAccessor) ([90cad1e](https://github.com/lung-interactive/sg-server/commit/90cad1e38418664c00b247c28a88acd4c572cf18))
* **versioning:** add single PlatformChip component ([3413bb0](https://github.com/lung-interactive/sg-server/commit/3413bb0cf374d513019e96e357e887e39ae4f9a1))
* **versions:** update create-game-version use-case and tests ([e022508](https://github.com/lung-interactive/sg-server/commit/e022508602673ca30bdda4dceeced264aef59f88))

# [2.14.0](https://github.com/lung-interactive/sg-server/compare/v2.13.0...v2.14.0) (2026-03-30)


### Bug Fixes

* **admin-panel:** correct visibility condition for clear button ([80c3ac4](https://github.com/lung-interactive/sg-server/commit/80c3ac4fc9d1a2ed2240ffd216aff6e6c27f19a8))


### Features

* **admin-panel:** layout top bar — inline controls and horizontal spacing\n\nRework top-bar template to separate left/right areas and add horizontal padding. ([843166b](https://github.com/lung-interactive/sg-server/commit/843166bc59f24cebd8d8222f9e74e7a7986de9db))

# [2.13.0](https://github.com/lung-interactive/sg-server/compare/v2.12.0...v2.13.0) (2026-03-29)


### Bug Fixes

* **admin:** remove deprecated CLI arg from docker-compose ([6ad1445](https://github.com/lung-interactive/sg-server/commit/6ad1445f5804448999416d2b3724e7f719d6f34a))


### Features

* **admin-panel:** angular 20 migration and compatibility fixes ([4d10581](https://github.com/lung-interactive/sg-server/commit/4d10581f4efcc41c67b23338d501f2ee1a899705))
* **migration:** add generic trackByIndex helpers & finalize [@for](https://github.com/for) migration ([3d14a03](https://github.com/lung-interactive/sg-server/commit/3d14a038f63075542b4d8ae8ed5fc7474eb52b9e))
* **migration:** convert safe *ngFor to [@for](https://github.com/for) (with track) ([76ca1f8](https://github.com/lung-interactive/sg-server/commit/76ca1f82d9005d6453b1585ac4c91e1dc5b60fa5))
* **migration:** convert simple *ngIf to [@if](https://github.com/if) blocks ([5b29715](https://github.com/lung-interactive/sg-server/commit/5b29715916d5c5cd2324b88ec9259b66aff94986))
* **migration:** invoke track functions in [@for](https://github.com/for) blocks to satisfy NG8115 ([5f7b5e5](https://github.com/lung-interactive/sg-server/commit/5f7b5e5ca5a99a5fab0d1f2b337520dff26cc6fb))
* **styles:** add flex + spacing utility styles ([73cdef1](https://github.com/lung-interactive/sg-server/commit/73cdef1e68625ba15bb6d00170466d3f47cb6ef7))

# [2.12.0](https://github.com/lung-interactive/sg-server/compare/v2.11.1...v2.12.0) (2026-03-29)


### Features

* **release:** use @semantic-release/exec to update package.json/version during prepare ([78f0735](https://github.com/lung-interactive/sg-server/commit/78f07352e5396358880f7665156f19298016923f))

## [2.11.1](https://github.com/lung-interactive/sg-server/compare/v2.11.0...v2.11.1) (2026-03-29)


### Bug Fixes

* trigger ([36e5f46](https://github.com/lung-interactive/sg-server/commit/36e5f46094d4fe297a752fb1f6145e350f301af3))

# [2.11.0](https://github.com/lung-interactive/sg-server/compare/v2.10.0...v2.11.0) (2026-03-29)


### Bug Fixes

* **admin:** update admin panel games service usage ([e8f53ba](https://github.com/lung-interactive/sg-server/commit/e8f53baa8983be33f57327ac43702ae8eff3aa67))
* **auth:** correct Twitch get-twitch-auth-data usecase ([739c040](https://github.com/lung-interactive/sg-server/commit/739c0409b651fd49c7d7f0fe634e72da4568dd13))
* **backoffice:** align backoffice games controller & facade ([f82a35a](https://github.com/lung-interactive/sg-server/commit/f82a35afb2cdf9444cf6b97033b5e6565a9778b7))
* package.json mess ([a295ec9](https://github.com/lung-interactive/sg-server/commit/a295ec907706ba5588f1be2e4dad7f5fadd1e089))
* **tests:** adjust life-cycle init unit test ([f8010b0](https://github.com/lung-interactive/sg-server/commit/f8010b0a7f381ac72825c2e5f4d9e0ac52a17800))
* **tsconfig:** update app-system TypeScript config ([e4001e5](https://github.com/lung-interactive/sg-server/commit/e4001e52aa6d98ee8629fceac593acd6543c8fc9))
* **types:** add dev deps and tsconfig adjustments for shared-types watcher ([7180dd4](https://github.com/lung-interactive/sg-server/commit/7180dd40446bbf32b95c5819562f5f57ce6f7b20))
* **usecase:** add ListGamesUseCase implementation to satisfy DI in tests ([4562ca1](https://github.com/lung-interactive/sg-server/commit/4562ca1b66fcba4541c49d482fb93b7d64e91660))


### Features

* **admin:** make app-admin-panel Dockerfile workspace-independent ([f789916](https://github.com/lung-interactive/sg-server/commit/f78991680b4bef355fca657015a43944594089c0))
* **ci:** install semantic-release plugins in CI release job ([7ffb7ba](https://github.com/lung-interactive/sg-server/commit/7ffb7ba097edd7075d902a86b02e009837c8bd49))
* **deps:** bump NestJS, @nestjs/swagger, dockerode and ioredis in workspaces ([9309b81](https://github.com/lung-interactive/sg-server/commit/9309b816e0a936f353efd943480bcf6bc10bcc51))
* **games:** enforce availability validation for public endpoints ([90af9df](https://github.com/lung-interactive/sg-server/commit/90af9dfb9082047836a3e15cec2431df3784bb78))

# [2.10.0](https://github.com/lung-interactive/sg-server/compare/v2.9.0...v2.10.0) (2026-03-26)


### Features

* **dev:** add dev-only 'Start Immediately' maintenance button ([6026e09](https://github.com/lung-interactive/sg-server/commit/6026e0915fb25a52e0cd747ef318e23612c3fbc0))
* **editor:** use 'code' mode for read-only JSON editors ([569a6a6](https://github.com/lung-interactive/sg-server/commit/569a6a6a7827f453686e6103bf6c46deab692c06))

# [2.9.0](https://github.com/lung-interactive/sg-server/compare/v2.8.2...v2.9.0) (2026-03-26)


### Bug Fixes

* **app-admin-panel:** adjust SG games service integration ([6039bb7](https://github.com/lung-interactive/sg-server/commit/6039bb72dbdc3aba9b8dcb84c3921c9e35872361))
* **tests:** align CreateGameUseCase unit test with constructor and mocks ([6076078](https://github.com/lung-interactive/sg-server/commit/60760781e97e0632d940e43f00317e9edc606307))


### Features

* **app-admin-panel:** add game-create component ([f675f59](https://github.com/lung-interactive/sg-server/commit/f675f5913b62704294e5dcce474fed48c3dd3b8d))
* **app-admin-panel:** add games list feature and interactive cards ([816605a](https://github.com/lung-interactive/sg-server/commit/816605aad16027970cb98c008da97ebfa20b1ce0))
* **app-admin-panel:** update games list UI and navigation ([a9d8e8d](https://github.com/lung-interactive/sg-server/commit/a9d8e8dbcde295d6660bc0605826a8e1e899cba9))
* **sg-games:** add minimal create flow and paginated backoffice listing ([f9beee3](https://github.com/lung-interactive/sg-server/commit/f9beee313bd3254440b0a6f73247be272360c084))

## [2.8.2](https://github.com/lung-interactive/sg-server/compare/v2.8.1...v2.8.2) (2026-03-26)


### Bug Fixes

* **maintenance:** auto-install system deps and build shared types in preflight ([a004f2e](https://github.com/lung-interactive/sg-server/commit/a004f2e87597c2a8f11dfbf1caaa380b93446d15))

## [2.8.1](https://github.com/lung-interactive/sg-server/compare/v2.8.0...v2.8.1) (2026-03-26)


### Bug Fixes

* **launcher:** support underscore-delimited versions in launcher build listing ([eb41025](https://github.com/lung-interactive/sg-server/commit/eb41025194ad462946230f4b87756ef7786c40d1))

# [2.8.0](https://github.com/lung-interactive/sg-server/compare/v2.7.2...v2.8.0) (2026-03-25)


### Features

* **launcher:** implement paginated launcher builds endpoint with S3 cursor support ([843a23d](https://github.com/lung-interactive/sg-server/commit/843a23db4762165054dac1ff025e871c92e39a01))

## [2.7.2](https://github.com/lung-interactive/sg-server/compare/v2.7.1...v2.7.2) (2026-03-24)


### Bug Fixes

* **auth:** never append port in production when building admin invite URL ([5af9e77](https://github.com/lung-interactive/sg-server/commit/5af9e77d30fc8638c7e510ea6959a9cb1fa1d5da))

## [2.7.1](https://github.com/lung-interactive/sg-server/compare/v2.7.0...v2.7.1) (2026-03-24)


### Bug Fixes

* **auth:** omit default/port 80 when building admin invite URL ([216f7eb](https://github.com/lung-interactive/sg-server/commit/216f7ebc79e78467e036effb10ecb313698bd497))

# [2.7.0](https://github.com/lung-interactive/sg-server/compare/v2.6.0...v2.7.0) (2026-03-24)


### Features

* **admin-panel:** add HMS users invite flow entrypoint and page scaffold ([0ba7aa5](https://github.com/lung-interactive/sg-server/commit/0ba7aa51129cdd11e0112d9dd5bcdb8783a4c6e9))
* **shared-types:** add DTO for admin invite creation response ([1769fa3](https://github.com/lung-interactive/sg-server/commit/1769fa3b615f461e7e77d569ca4c93c20b137cf3))

# [2.6.0](https://github.com/lung-interactive/sg-server/compare/v2.5.4...v2.6.0) (2026-03-24)


### Features

* **sg-games:** accept version UUID or semver on public crowd-actions endpoint ([22fe568](https://github.com/lung-interactive/sg-server/commit/22fe5681594ca0123fbcc3b261b3f5697f866d7b))
* **sg-games:** resolve crowd actions version by semver on public endpoint ([6d0ed17](https://github.com/lung-interactive/sg-server/commit/6d0ed1731b2c5335a37d63cea5c761b3520c0be9))

## [2.5.4](https://github.com/lung-interactive/sg-server/compare/v2.5.3...v2.5.4) (2026-03-04)


### Bug Fixes

* **admin:** update production environment for admin panel ([4fecbb9](https://github.com/lung-interactive/sg-server/commit/4fecbb9391ae114287d96f559be047e67fc8fc66))

## [2.5.3](https://github.com/lung-interactive/sg-server/compare/v2.5.2...v2.5.3) (2026-03-03)


### Bug Fixes

* **compose:** map admin host port 82 to container port 80 and update healthcheck ([b2edea9](https://github.com/lung-interactive/sg-server/commit/b2edea9529d78c383cc335875713634ba0c2d1af))

## [2.5.2](https://github.com/lung-interactive/sg-server/compare/v2.5.1...v2.5.2) (2026-03-03)


### Bug Fixes

* **admin:** install full nginx.conf as /etc/nginx/nginx.conf (not conf.d) ([85d1dbb](https://github.com/lung-interactive/sg-server/commit/85d1dbbe7c2d47dcf822576efc4b28b995eee8e0))
* **admin:** remove default nginx conf.d snippet before installing full nginx.conf ([5e5f3d7](https://github.com/lung-interactive/sg-server/commit/5e5f3d71461b473ff15dd02a25e0fadc6439a3c6))

## [2.5.1](https://github.com/lung-interactive/sg-server/compare/v2.5.0...v2.5.1) (2026-03-03)


### Bug Fixes

* **admin:** ensure @hms/shared-types is resolvable during admin build ([4d7d1eb](https://github.com/lung-interactive/sg-server/commit/4d7d1eb4f67f41cb70ce366db227b4183cbeab01))

# [2.5.0](https://github.com/lung-interactive/sg-server/compare/v2.4.1...v2.5.0) (2026-03-03)


### Bug Fixes

* **admin:** correct nginx.conf path in admin Dockerfile ([2c0cb48](https://github.com/lung-interactive/sg-server/commit/2c0cb48309d716dd3022e3c32de6445f4c4d08bc))
* **admin:** serve admin at root in production (base-href=/) ([1cf9ca2](https://github.com/lung-interactive/sg-server/commit/1cf9ca27fe1b3f1929d7fa9a4b9abed282a84554))
* **compose:** use admin-production build target for admin panel ([0f7c241](https://github.com/lung-interactive/sg-server/commit/0f7c2410ceb04e28b02168daa794f89ecbd78ab0))


### Features

* **admin:** serve admin panel as separate production service ([5322c7d](https://github.com/lung-interactive/sg-server/commit/5322c7d8b24c9cd263dfd5aeb92630807a7a177c))

## [2.4.1](https://github.com/lung-interactive/sg-server/compare/v2.4.0...v2.4.1) (2026-03-03)


### Bug Fixes

* **docker:** skip building game images in production ([8e775a6](https://github.com/lung-interactive/sg-server/commit/8e775a6f499c465986634eff948f0b3285456e72))

# [2.4.0](https://github.com/lung-interactive/sg-server/compare/v2.3.1...v2.4.0) (2026-03-03)


### Features

* **logger:** improve error logging for Error objects ([a009035](https://github.com/lung-interactive/sg-server/commit/a00903537088365275abee3104419d5622bed87d))

## [2.3.1](https://github.com/lung-interactive/sg-server/compare/v2.3.0...v2.3.1) (2026-03-03)


### Bug Fixes

* **i18n:** use relative TranslateHttpLoader path so assets respect base href ([5256187](https://github.com/lung-interactive/sg-server/commit/5256187a9d5f4caf993de1b42f0db92e42cca29b))

# [2.3.0](https://github.com/lung-interactive/sg-server/compare/v2.2.1...v2.3.0) (2026-03-02)


### Bug Fixes

* **hms:** use production system.baseUrl for socket connection ([65add04](https://github.com/lung-interactive/sg-server/commit/65add045dd26f56669277ba3ee4c66931c5513ff))


### Features

* **app-settings:** initialize base URL from environment.production ([9d70094](https://github.com/lung-interactive/sg-server/commit/9d70094ecdc21c87d0911522259d9cd0884596f1))

## [2.2.1](https://github.com/lung-interactive/sg-server/compare/v2.2.0...v2.2.1) (2026-03-02)


### Bug Fixes

* **env:** correct admin panel production system URL and port ([be71407](https://github.com/lung-interactive/sg-server/commit/be71407d3ee7b74827ff62a02ab4f8c23b538c95))

# [2.2.0](https://github.com/lung-interactive/sg-server/compare/v2.1.5...v2.2.0) (2026-03-02)


### Features

* **env:** set production flag in admin panel prod environment ([3754c7d](https://github.com/lung-interactive/sg-server/commit/3754c7d4859f713689d38709698776053e54b5d7))

## [2.1.5](https://github.com/lung-interactive/sg-server/compare/v2.1.4...v2.1.5) (2026-03-02)


### Bug Fixes

* **ci:** add ADMIN_BUILD_CONFIG build-arg to hms-api build ([0280390](https://github.com/lung-interactive/sg-server/commit/02803901a62667f979c123fedb8ee534d8181ee0))
* **ci:** use APP_ENVIRONMENT for ADMIN_BUILD_CONFIG build-arg ([cd147b7](https://github.com/lung-interactive/sg-server/commit/cd147b7abb4937d2bf77b58070b95ab66e708264))

## [2.1.4](https://github.com/lung-interactive/sg-server/compare/v2.1.3...v2.1.4) (2026-03-02)


### Bug Fixes

* https instead of http ([2b27adc](https://github.com/lung-interactive/sg-server/commit/2b27adc158fc6dc1ead88fdaf0d904dff606ba5b))
* url ([670a8d4](https://github.com/lung-interactive/sg-server/commit/670a8d4a5e581f5b1d5f218f06eb48624abe0a49))

## [2.1.3](https://github.com/lung-interactive/sg-server/compare/v2.1.2...v2.1.3) (2026-03-02)


### Bug Fixes

* api base url for environment. ([16adbbf](https://github.com/lung-interactive/sg-server/commit/16adbbf41738aa6123c0a4fa12b8406d438b77cb))

## [2.1.2](https://github.com/lung-interactive/sg-server/compare/v2.1.1...v2.1.2) (2026-03-01)


### Bug Fixes

* **app-admin-panel:** update version input component ([0da36f4](https://github.com/lung-interactive/sg-server/commit/0da36f40a2e0eb59496a2bccb26ac2d3815cbfce))

## [2.1.1](https://github.com/lung-interactive/sg-server/compare/v2.1.0...v2.1.1) (2026-01-26)


### Bug Fixes

* **docker:** ensure app-system uses tsconfig.build for nest build ([7b701e3](https://github.com/lung-interactive/sg-server/commit/7b701e368a2777fa0acce8d5b37eef17cf9913ac))
* **docker:** include app-shared-types runtime deps in app-system image ([636c39e](https://github.com/lung-interactive/sg-server/commit/636c39e2711fac644e77e22aceae9e77459174ff))
* **docker:** include package.json and install shared-types deps in api image ([0bb3305](https://github.com/lung-interactive/sg-server/commit/0bb33058fc0869b2770f1f6d6a0fc6fecdc4b3b6))

# [2.1.0](https://github.com/lung-interactive/sg-server/compare/v2.0.0...v2.1.0) (2026-01-26)


### Features

* **docker:** add mailhog standalone compose ([9d03e2f](https://github.com/lung-interactive/sg-server/commit/9d03e2f191d98a180fd712639b3a64f211c18e3c))

# [2.0.0](https://github.com/lung-interactive/sg-server/compare/v1.8.0...v2.0.0) (2026-01-26)


### Bug Fixes

* add explicit type decorators for mongoose enum fields ([f903297](https://github.com/lung-interactive/sg-server/commit/f903297128ca62c976fe3889ca38305564210379))
* **admin-panel:** improve error interceptor to handle 401 and trigger logout ([8df7443](https://github.com/lung-interactive/sg-server/commit/8df7443440de8e2dddfd3d44d82cf1b82039bd2b))
* **admin-panel:** prevent cursor jump in crowd actions JSON editor ([9d17d04](https://github.com/lung-interactive/sg-server/commit/9d17d0414f60647b89cdd47d971937c3aa23df81))
* **admin-panel:** register ErrorInterceptor to handle HTTP errors globally ([23e18f0](https://github.com/lung-interactive/sg-server/commit/23e18f0be224f5493c3870692179f8735fc5b45d))
* **api:** make MongoDB connection optional when DB_GAME_ENABLED=no ([2c38a3c](https://github.com/lung-interactive/sg-server/commit/2c38a3c14c19a026bbb8d1f82f24b18f4f82ab72))
* **build:** support renamed shared-types folder and fix dev Docker installs ([905b9fc](https://github.com/lung-interactive/sg-server/commit/905b9fcdb34048a83bbdedfae03e3a6f5d19fd62))
* **ci:** build app-shared-types before running tests ([e498eb5](https://github.com/lung-interactive/sg-server/commit/e498eb5903cd2e957f99cb26c5c3aeb87b07c715))
* **core:** standardize GameMetadata schema, types, and mocks ([f575b81](https://github.com/lung-interactive/sg-server/commit/f575b819cbf1cc812e656f0d19e18b21b56eb6c9))
* map version metadata acknowledgment status in under-development view ([ad19e78](https://github.com/lung-interactive/sg-server/commit/ad19e78f132dd3fa9085eb64c38a2ec33ba2eeab))
* restore version-update-type import in game-management service ([d267063](https://github.com/lung-interactive/sg-server/commit/d26706348852a86ce9c651fba8a26824863d229b))
* restructured folders ([736c44a](https://github.com/lung-interactive/sg-server/commit/736c44a040a2f3ea3c76a8fcc8258f2b5d507aa4))
* **shared-types:** adjust build output and paths for monorepo compatibility ([8932823](https://github.com/lung-interactive/sg-server/commit/893282397c5221f7e4a01a54eab5b9fa79d8738d))
* stabilize admin metadata flows and build configuration ([97a75d4](https://github.com/lung-interactive/sg-server/commit/97a75d418ccf7e90e4b32a8144b3ea114e7248bf))
* **ui:** show Homologation badge label and add homologation style ([1d81f80](https://github.com/lung-interactive/sg-server/commit/1d81f80cb766c14859cee5560d2f7f6468ed3361))
* **versions:** remove Ready from blocking states ([b0cd3d5](https://github.com/lung-interactive/sg-server/commit/b0cd3d5e295d52d01a45014091ca4d0b9737ef20))


### Features

* add acknowledge version use case ([a6dbdeb](https://github.com/lung-interactive/sg-server/commit/a6dbdeb90e01f97e21e5ad03beac212b639d2072))
* add crowd-actions repository with typeorm ([dc0d8b1](https://github.com/lung-interactive/sg-server/commit/dc0d8b1f74d3aeffd752b701e5dbfad60d6b3929))
* add getVersionMetadata method to GamesService ([f707248](https://github.com/lung-interactive/sg-server/commit/f707248f09c0295aba2126a9e190b8c9c93d218d))
* add GetVersionUnderDevelopment use case ([8e285ca](https://github.com/lung-interactive/sg-server/commit/8e285caeed1c053fe6abe339c0b7da41f15df338))
* add version acknowledgment DTO ([210c7e2](https://github.com/lung-interactive/sg-server/commit/210c7e2e78a7b3a8da9d5b712c9cb26fffcf49bd))
* add version filtering endpoint to backoffice controller ([b26035d](https://github.com/lung-interactive/sg-server/commit/b26035d941085438df60068555dd4f69fca9773e))
* add version filtering endpoint to development controller ([dbb1ecf](https://github.com/lung-interactive/sg-server/commit/dbb1ecf0b99e402dcf3c3236050d35592c48448f))
* **admin-panel/versions:** improve UI version input and error handling ([7a7094d](https://github.com/lung-interactive/sg-server/commit/7a7094dd69b04c2e16fe799119f20d05da6b9e90))
* **admin-panel:** add configurable initial mode for JSON editors ([84ab2ce](https://github.com/lung-interactive/sg-server/commit/84ab2ce0d51d7acf413ffe657015cf0bb2a6448f))
* **admin-panel:** add confirmation dialogs for version development actions ([f262139](https://github.com/lung-interactive/sg-server/commit/f26213966633bad166cb5ec918ec5e5e244901ea))
* **admin-panel:** add crowd action mappings JSON editor component ([7cb540d](https://github.com/lung-interactive/sg-server/commit/7cb540d1044d36231ab3df52b9875270e42b0f74))
* **admin-panel:** add crowd actions API integration ([ce6976d](https://github.com/lung-interactive/sg-server/commit/ce6976deeba2e8cd8c97560853c6e5ba136de1cb))
* **admin-panel:** add crowd actions dialog component ([c0e159a](https://github.com/lung-interactive/sg-server/commit/c0e159a8d70c7d52a10053b2c29453023a714428))
* **admin-panel:** add jsoneditor dependency ([0dfb8ff](https://github.com/lung-interactive/sg-server/commit/0dfb8ff02b15e10fe8548425e6226394a15d39a8))
* **admin-panel:** add missing version state badges ([ac6dc6c](https://github.com/lung-interactive/sg-server/commit/ac6dc6cb04c952067f0e0e8c68d19ef66118e912))
* **admin-panel:** add save functionality to crowd actions editor ([546f7a9](https://github.com/lung-interactive/sg-server/commit/546f7a93129901294ac9676d964dc242376fea7d))
* **admin-panel:** add tabs navigation to crowd actions dialog ([9f95cee](https://github.com/lung-interactive/sg-server/commit/9f95cee7fa660229c40f446fbc87606c07c8d22e))
* **admin-panel:** add update methods for crowd actions and mappings ([4a88a5e](https://github.com/lung-interactive/sg-server/commit/4a88a5e43027d5bea319952f72fd6b33ef1f55d1))
* **admin-panel:** add warning method to AlertsService ([a8ab12b](https://github.com/lung-interactive/sg-server/commit/a8ab12b896c0dabe2f771e61b8f9b8abf5a2f478))
* **admin-panel:** create crowd actions JSON editor component ([07097b9](https://github.com/lung-interactive/sg-server/commit/07097b937f2ec8773719841899edbe582e1816b6))
* **admin-panel:** implement save functionality for crowd actions dialog ([6f5e944](https://github.com/lung-interactive/sg-server/commit/6f5e944bebfd676b09520eec1de93f2d578509a6))
* **admin-panel:** integrate JSON editor in crowd actions dialog ([404b45f](https://github.com/lung-interactive/sg-server/commit/404b45f0cdfd59db7f35197b8568aceee91c65f9))
* **admin-panel:** integrate mappings editor in crowd actions dialog ([4d077ec](https://github.com/lung-interactive/sg-server/commit/4d077ec25e5c86476b1150ef9b7cf5ffd9db68f1))
* **admin:** add awaiting-development-approval view with state transitions ([91c14db](https://github.com/lung-interactive/sg-server/commit/91c14dbbc3c358a9cfee9794b4aa9c3ca3b872b2))
* **admin:** revert homologation versions to development ([b6d2440](https://github.com/lung-interactive/sg-server/commit/b6d2440927d8d00e7114aa8d449c8e84d97a8c3c))
* **api:** add GamesManagementModule with controller and service ([696abc8](https://github.com/lung-interactive/sg-server/commit/696abc85eb16230c45a98f1cca0df4bc0ccce086))
* **api:** add GetVersionMetadata use case in core module ([bf1fd88](https://github.com/lung-interactive/sg-server/commit/bf1fd88726345faf4606f109fe68acd386392001))
* **api:** add meta JSONB field to sg_versions table ([7be157d](https://github.com/lung-interactive/sg-server/commit/7be157d5d17bc98ef09de59c6bfe4dfe4f4c05c0))
* **api:** add update use case for crowd action mappings ([0925be1](https://github.com/lung-interactive/sg-server/commit/0925be11cde7130d46cf82ab1a1439cf790596ea))
* **api:** add update use case for crowd actions ([df329e2](https://github.com/lung-interactive/sg-server/commit/df329e275e59146aeb34508d5cac3b167c417658))
* **api:** add version metadata endpoint to backoffice module ([70108e9](https://github.com/lung-interactive/sg-server/commit/70108e97accd8121a837179202d63bbb0a41730d))
* **api:** add version metadata endpoint to development module ([6b91bf6](https://github.com/lung-interactive/sg-server/commit/6b91bf62b7103f15b0a3a1f7b4f735d63866cdfa))
* **api:** add version state transition endpoints for under-development and canceled ([19f7b60](https://github.com/lung-interactive/sg-server/commit/19f7b60bcf162d22dcf2652aff3c2a1b5d0a384d))
* **api:** add versioned crowd actions stored in SQL ([121e211](https://github.com/lung-interactive/sg-server/commit/121e211d51a99abcb89a551ffbb7d2a34e4704fe))
* **api:** auto-duplicate crowd actions on version creation ([a665b49](https://github.com/lung-interactive/sg-server/commit/a665b49bca450c1e5b2e87d2fbace6edc445655b))
* **backoffice:** add endpoint to get version crowd actions ([191da99](https://github.com/lung-interactive/sg-server/commit/191da99d21e50b5f253fdb8707b7df7820dda53e))
* **backoffice:** add revert-version-from-homologation use case and wiring ([5a033a5](https://github.com/lung-interactive/sg-server/commit/5a033a5207cebed3132d72008586e27a08e7bca6))
* create under-development version view component ([985cfb0](https://github.com/lung-interactive/sg-server/commit/985cfb0e204f4d990c880a21ef2e5ddac4647e94))
* **docker:** add standalone PostgreSQL container for network access ([e83693b](https://github.com/lung-interactive/sg-server/commit/e83693b7193c4492f3e495fe59128d3940feba94))
* **games/backoffice:** add use cases to cancel and start development ([cadada6](https://github.com/lung-interactive/sg-server/commit/cadada6a66de5a8881697b1662a213bef64ba77f))
* **games/backoffice:** strengthen create-version validation and errors ([1b871d9](https://github.com/lung-interactive/sg-server/commit/1b871d97393412c32644d205e9f9d25901dc0913))
* **games/core:** extract GetVersionCrowdActionsUseCase to core ([10bd2cc](https://github.com/lung-interactive/sg-server/commit/10bd2cc34177e494b3ce4e7e1a0fc5f1158e4a2a))
* **games/development:** add send-to-homologation use-case and wire through facade/controller/module ([71bcb8e](https://github.com/lung-interactive/sg-server/commit/71bcb8ed162c0322edcfe5d6452113193076f6b8))
* **games/development:** require version acknowledgment before build upload ([7108041](https://github.com/lung-interactive/sg-server/commit/710804170454f875c10705493c1779c2e7888df3))
* **games/public:** add public crowd-actions endpoint, facade and DTO ([bd62966](https://github.com/lung-interactive/sg-server/commit/bd62966726dac030eb4d99544da0f406dd5074cf))
* initialize version metadata on creation ([6583b05](https://github.com/lung-interactive/sg-server/commit/6583b05f2d1c13e57acc63f2825b28611bb0c2f0))
* integrate acknowledge version in development module ([5f5cbd8](https://github.com/lung-interactive/sg-server/commit/5f5cbd82bb628e26c535be9760b38c1901a08c05))
* integrate GetVersionUnderDevelopment in development module ([3ad1811](https://github.com/lung-interactive/sg-server/commit/3ad1811dd02f580031629baa3757ae029230cb72))
* integrate under-development view in versions component ([d8573fc](https://github.com/lung-interactive/sg-server/commit/d8573fc4191961443ae7f8c134315f7c0e87e60b))
* **repo/version:** add DB helper to find versions by state ([ec8c967](https://github.com/lung-interactive/sg-server/commit/ec8c967891aec9143fb69c8011dbd978111bf307))
* **seed:** improve transaction error handling in MongoGameMetadataSeed ([2666a97](https://github.com/lung-interactive/sg-server/commit/2666a979b28277569602e3112fbbb7c38036c69b))
* **seeds:** store SemanticVersion objects in development seeds ([bb9ee1f](https://github.com/lung-interactive/sg-server/commit/bb9ee1f0a83ba9a21f3c7b3caf198caa5cba76c1))
* **sg-core:** add FilterVersionsUseCase for querying versions ([4cdf9eb](https://github.com/lung-interactive/sg-server/commit/4cdf9eb7904b1fa79a9f545044c108cdc37da45d))
* **shared-types:** add FilterVersionsInput interface ([e6d2011](https://github.com/lung-interactive/sg-server/commit/e6d2011558eee9d37c46f33a306d8029e71651c2))
* **shared-types:** add version metadata interfaces and enums ([5097f5d](https://github.com/lung-interactive/sg-server/commit/5097f5dca0b1c3cc6c20a285c8dbc53413c8516d))
* **ui:** add homologation view files ([8f1980d](https://github.com/lung-interactive/sg-server/commit/8f1980d0ba7d2dc6667519b0d86500cc9ba0886a))
* **ui:** homologation badge label and style updates ([81c8df0](https://github.com/lung-interactive/sg-server/commit/81c8df054b95846ecb1069df41358525945e2912))
* update Dockerfiles, TypeScript configs, and package files for improved build and metadata support ([b3d8d0a](https://github.com/lung-interactive/sg-server/commit/b3d8d0aea15d5d40312b499241d55cc32f6118dd))
* **versioning:** add Canceled state to VersionState enum ([0e7aead](https://github.com/lung-interactive/sg-server/commit/0e7aead41dfd1d23babe39581aa1d29511f891a6))
* **versioning:** implement game version creation workflow and endpoint ([0251729](https://github.com/lung-interactive/sg-server/commit/0251729c0f12c1f07c56cfc547b0cc140d970390))


### BREAKING CHANGES

* **api:** Crowd actions are now stored per version in PostgreSQL
instead of per game in MongoDB, enabling version-specific action definitions
and proper historical tracking.
* **build:** local folder shared-types renamed to app-shared-types — update local workflows accordingly.

# [1.8.0](https://github.com/lung-interactive/sg-server/compare/v1.7.0...v1.8.0) (2025-12-08)


### Features

* **infra:** add docker-compose.production.local-mongo.yml for local MongoDB in production ([6326f7e](https://github.com/lung-interactive/sg-server/commit/6326f7ea3d0b2c90b741c2ce80b320c0fe48d369))

# [1.7.0](https://github.com/lung-interactive/sg-server/compare/v1.6.0...v1.7.0) (2025-11-27)


### Bug Fixes

* **redis:** add key/token validation and organize code with regions ([05206c4](https://github.com/lung-interactive/sg-server/commit/05206c4b664ac19ecb8404ce70f87616dc26c7d6))


### Features

* **core:** improve code quality, validation, and documentation across models and enums ([65f205a](https://github.com/lung-interactive/sg-server/commit/65f205a1b97456ac67bbe078717507bb87dff5d8))
* improve production Docker Compose and game metadata update logic ([314064b](https://github.com/lung-interactive/sg-server/commit/314064b666136a3d2269a616a51d4a84ea3e41fb))

# [1.6.0](https://github.com/lung-interactive/sg-server/compare/v1.5.0...v1.6.0) (2025-10-09)


### Features

* **hms-maintenance:** :sparkles: Created the maintenance flow ([494f5aa](https://github.com/lung-interactive/sg-server/commit/494f5aa16543b29735e2ae244b52143d1ef6f7b5)), closes [lung-interactive/sg-server#7](https://github.com/lung-interactive/sg-server/issues/7)

# [1.5.0](https://github.com/lung-interactive/sg-server/compare/v1.4.0...v1.5.0) (2025-10-09)


### Bug Fixes

* adding healthy check to docker compose hms-admin-panel ([726ae02](https://github.com/lung-interactive/sg-server/commit/726ae0203756f03d173863363215165275bda1e9))
* authcontroller ([ccd7d8f](https://github.com/lung-interactive/sg-server/commit/ccd7d8fe7c72e2e8c8bb3a35603f50afcce68d24))
* hms-utils stack naming ([7dfbdac](https://github.com/lung-interactive/sg-server/commit/7dfbdac88c15e809c3f89d4f23395373c8952f07))
* refactoring game-backoffice.service. Breaking it into usecases ([7e3f280](https://github.com/lung-interactive/sg-server/commit/7e3f280e21ef7967c7945a46c64d7876e8926c5e))
* SELinux allowance ([da6cb93](https://github.com/lung-interactive/sg-server/commit/da6cb930550dce5b298e2017c4aa15e2ced58fa8))
* staging in SELinux distros ([c911776](https://github.com/lung-interactive/sg-server/commit/c9117763a15bbeae28f8064639135e8ac6490bfd))
* system admin authentication ([d0d86a6](https://github.com/lung-interactive/sg-server/commit/d0d86a6eedc42996f54ee5ef880a52327c17a246))
* tsconfig for system ([bac3da9](https://github.com/lung-interactive/sg-server/commit/bac3da975ad01b95dbe31233dc4be57d2b00f767))
* username availabilitity is now under correct route ([cefa312](https://github.com/lung-interactive/sg-server/commit/cefa312a516f60fe7e70afae151f1e760c9d86e6))
* Username availability is now under correct route ([a8327d2](https://github.com/lung-interactive/sg-server/commit/a8327d230a045815c0aa0ad23d82d246688a6b3c))
* waiting for approval versions are now listed for possible testers ([df0230b](https://github.com/lung-interactive/sg-server/commit/df0230b8f27e03f12aed1bf24e14b1e47f27d357))


### Features

* allowing 4.4 mongodb ([1cd0542](https://github.com/lung-interactive/sg-server/commit/1cd0542894d62717bed45996577dfef901efc2d2))
* **games-backoffice:** :sparkles: Created the "reject version" button ([63f2220](https://github.com/lung-interactive/sg-server/commit/63f222077671f416d37bc3edd64efeb0bf09d0d6)), closes [lung-interactive/sg-server#6](https://github.com/lung-interactive/sg-server/issues/6)
* get game's latest version ([349b80a](https://github.com/lung-interactive/sg-server/commit/349b80ac341cfee9fb163dd7676c8fde0ceaaa13))
* versioning view component for admin panel ([a13a351](https://github.com/lung-interactive/sg-server/commit/a13a3513154af7cde99bc2997f534c7938d00da5))

# [1.4.0](https://github.com/lung-interactive/sg-server/compare/v1.3.0...v1.4.0) (2025-09-03)


### Bug Fixes

* Monorepo is now available for staging ([7780739](https://github.com/lung-interactive/sg-server/commit/7780739d4c6472b33def630302e2e6a7237d4c83))
* tests in monorepo ([9edf54b](https://github.com/lung-interactive/sg-server/commit/9edf54b0c27c591373772e5b0ee66ef6ca8c8e4c))


### Features

* Better monorepo composition ([1b0791a](https://github.com/lung-interactive/sg-server/commit/1b0791a75d97bfd426568b34c7ed23071d5b4641))

# [1.3.0](https://github.com/lung-interactive/sg-server/compare/v1.2.0...v1.3.0) (2025-09-02)


### Bug Fixes

* changed folder structure to hms-{app} instead of sg-{app} ([7a93b16](https://github.com/lung-interactive/sg-server/commit/7a93b16bf9b7ec9326bacb0fb5cdc86536e781b8))
* Fixed type sucess to success ([1bb0244](https://github.com/lung-interactive/sg-server/commit/1bb0244a03e9fe93cb58ea8149652099574b4089))
* refactored ids to UUIDs for better external integration ([3df5850](https://github.com/lung-interactive/sg-server/commit/3df5850af555bdd6b394e1430dbda60ee4b90005))
* removed AppService from SystemService ([e80fcd4](https://github.com/lung-interactive/sg-server/commit/e80fcd49bf770a891deff9d7c0fb0788c4b4b262))
* removed axios and added @nestjs/axios ([ea17f9e](https://github.com/lung-interactive/sg-server/commit/ea17f9e242150bd31c118af02fcc3cf88800cd8d))
* removed secrets from docker-compose pipeline ([802cb8d](https://github.com/lung-interactive/sg-server/commit/802cb8db9bf7952e22510aa555009755cf5e7410))
* removing loggers from mailservice ([02e81b1](https://github.com/lung-interactive/sg-server/commit/02e81b19b1cc238b16c351708de334af1716c334))
* test-and-tag workflow no uses correct packages: ([c58d03f](https://github.com/lung-interactive/sg-server/commit/c58d03fe76b64b1e804565362e562d1383a81825))


### Features

* admin login ([c891814](https://github.com/lung-interactive/sg-server/commit/c891814ecfd390db34eaf994eed0d3609ff1dac5))
* **admin-auth:** admin user can now login using thei authenticator apps. ([bc69bd8](https://github.com/lung-interactive/sg-server/commit/bc69bd8d2fa479ce2430b1c8fbdaa1256b1992cc))
* **admin-auth:** Created login.component templates ([8f37b2c](https://github.com/lung-interactive/sg-server/commit/8f37b2c324048011fc1b712a72de748e63dd1eb8))
* **admin-panel:** Bronken token store into a service ([e1b4871](https://github.com/lung-interactive/sg-server/commit/e1b4871fbf61b25714a5d9f206c2da146888d3e3))
* **auth:** 2FA login now use primary 2fa method immediatly and email method as fallback if no primary method is set ([49e73e5](https://github.com/lung-interactive/sg-server/commit/49e73e5081da00f1deb7e88a0b725ccbc892ec9d))
* **auth:** created the admin auth service routine for inviting new admins to the app ([ec07782](https://github.com/lung-interactive/sg-server/commit/ec07782739b34b7b75cef36bd061c4b28179d792))
* **auth:** created the decorator for authsubject routes and the argument decorator to inject the authenticated user in controllers methods ([e5a21a1](https://github.com/lung-interactive/sg-server/commit/e5a21a1b8f9e374839073a9160b712f0bce3b613))
* **game-testers:** Created the game testers view ([ffc7ec1](https://github.com/lung-interactive/sg-server/commit/ffc7ec1a28c3e930bad4d6b83d35e47fbe9c1993))
* Games are now set to WaitingForAproval before getting ready. TODO: System admins must receive a notification through discord in order to validate WaitingForAproval games. ([44caad6](https://github.com/lung-interactive/sg-server/commit/44caad6df4fe53d390b3ef01fc5d8b6d5f7b95a5))
* **hms-db-game:** Removed the need of authentication while in development for mongodb ([8e225ac](https://github.com/lung-interactive/sg-server/commit/8e225ac4cf76be13efb7dcf71358610664a47fff))
* logout menu ([ee5e227](https://github.com/lung-interactive/sg-server/commit/ee5e2279379863fd0c63b5077c0a82e6f5bbc990))
* monorepo and releasing by tests ([3902b4c](https://github.com/lung-interactive/sg-server/commit/3902b4c5a741f3b38206c3ef39232aeb36c97597))
* **notifications:** Wow! Now we have the start of a notifications system. ([49b4d8d](https://github.com/lung-interactive/sg-server/commit/49b4d8dbe980e28d8382f36e4f6547905f778aeb))
* now user authentication injects the user as request.authenticated in the express Request object. ([26fac28](https://github.com/lung-interactive/sg-server/commit/26fac286f14bcfae866c9b7831ed1cc82c7e1e05))
* Now we can create the user "owner" through the app setup process acessing /setup in the hms-admin ui panel. ([5fdb15a](https://github.com/lung-interactive/sg-server/commit/5fdb15aa6deff575939e750312bc29793860b062))
* Server now have the capability to be setup ([bfa68ee](https://github.com/lung-interactive/sg-server/commit/bfa68ee16ea8e9728af46fbe99810f84c36b7623))
* **shared-types:** hms-shared-types folder created so services can share typescript files. ([dcd040f](https://github.com/lung-interactive/sg-server/commit/dcd040ff8f8b81d6ee8c02501b7875503147df13))
* **testers:** Crud granting and revoking game tester privilegies to users ([d2fc399](https://github.com/lung-interactive/sg-server/commit/d2fc3999f36c56747a11e7be19151a589ac0c91f))
* **user:** profile picture use case ([567f73e](https://github.com/lung-interactive/sg-server/commit/567f73e543b45903ec9525ce19d3c4bdcd819dbd))
* **users:** users are now listed by the api at /users/all ([1a9902a](https://github.com/lung-interactive/sg-server/commit/1a9902ae72d39e729dc2b8cf2c869460eebb6c3e))
* We now have the hms-admin application (admin UI) inside the container stack. ([679ff66](https://github.com/lung-interactive/sg-server/commit/679ff66eac92211cea7cb4df3c290410818407d1))

# [1.2.0](https://github.com/bravestreamers/sg-server/compare/v1.1.0...v1.2.0) (2025-07-22)


### Bug Fixes

* rolling back to unit testing only ([7850885](https://github.com/bravestreamers/sg-server/commit/78508851bc2fadba73db8a00cfed15b691c24ae9))


### Features

* e2e tests ([9558f6e](https://github.com/bravestreamers/sg-server/commit/9558f6e17d74df3299e7bb90a4edc8b4f095332e))

# [1.1.0](https://github.com/bravestreamers/sg-server/compare/v1.0.0...v1.1.0) (2025-07-22)


### Features

* launcher builds are now listed ([051489b](https://github.com/bravestreamers/sg-server/commit/051489b1bf2afb93b5808c53be841c64ab3689f3))
* we now have a service for the launcher. It means we can get the download url for the latest build in a channel. We also can list all builds in a channel for a platform. ([607440c](https://github.com/bravestreamers/sg-server/commit/607440c79de74e4bed548004965b1c93f0f128f2))

# 1.0.0 (2025-07-20)


### Bug Fixes

* added devDependencies ([57c19d3](https://github.com/bravestreamers/sg-server/commit/57c19d3975f8f38b5e99d71582ada3f939e0dfd6))
* again ([e09090a](https://github.com/bravestreamers/sg-server/commit/e09090ab5a6b542ab25c0999ecdad083ead57ba5))
* contents write ([06b6804](https://github.com/bravestreamers/sg-server/commit/06b6804e5a5b0a89928ac3f73a770b0be281d6b8))
* release ([1d71c98](https://github.com/bravestreamers/sg-server/commit/1d71c988d676ea00c1d4d576131738f31e7be37e))
* test-and ([3bcec51](https://github.com/bravestreamers/sg-server/commit/3bcec517db56627778a0636ac59ad4bf10fd7d46))
* test-and-tag ([56942db](https://github.com/bravestreamers/sg-server/commit/56942dbb89512a87f06d8e65bea820d26b4b1f0b))
* test-and-tag ([7077b79](https://github.com/bravestreamers/sg-server/commit/7077b79916110cc17d565832bb9e23e4319aafc3))
* testing issue ([ff084fe](https://github.com/bravestreamers/sg-server/commit/ff084fe61962a9df14a707261d5103cf5695153f))
* tests ([7e52528](https://github.com/bravestreamers/sg-server/commit/7e52528d3b8a4d527a82b94798aeef6269ef2376))


### Features

* now we have a process of versioning ([57a3dff](https://github.com/bravestreamers/sg-server/commit/57a3dffeaf2d6626bf54998006c505620f02d45f))
