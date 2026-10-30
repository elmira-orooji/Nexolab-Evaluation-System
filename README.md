# Nexolab

NexoLab is a Persian-first evaluation workspace for Retrieval-Augmented Generation (RAG) systems. It runs a test suite against a connected RAG API, stores answers, sources, citations, latency, errors, and configuration, and supports automatic analysis and human review.

The built-in fixture adapter only checks the execution and reporting workflow. It returns reference answers and does not measure a RAG system's quality.

The codebase follows a ports-and-adapters architecture. Domain models, the evaluation runner, RAG adapters, persistence, reports, and the web interface have separate responsibilities. See [Architecture](docs/architecture.md) for the boundaries and extension points.

## Features

- Connect to your RAG system
- Run versioned test suites and save a reproducible snapshot with every run.
- Review answers, sources, and citations manually in the web interface.
- Calculate deterministic document-recall and citation precision, recall, and F1 metrics when expected document IDs are supplied.
- Optionally use DeepEval to judge answer correctness and faithfulness.
- Compare completed runs and export JSON, CSV, and Markdown reports.
- Keep API tokens out of configuration files and redact the configured Nexora token from reports.

## Requirements

- Python 3.11 or later.
- Node.js and npm only when building or developing the frontend.

## Install

From the repository root:

~~~powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -e .
~~~

On Linux, activate the environment with:

~~~bash
source .venv/bin/activate
~~~

The package installs the CLI command nexolab. You can also run it as python -m nexolab.

## Start the local web interface

Create the local administrator account once:

~~~powershell
nexolab --create-admin --output runs
~~~

The command prompts for a username and password. Passwords must be at least 12 characters and are stored as hashes in a SQLite database.

Start the local server:

~~~powershell
nexolab --serve --suite datasets/persian.synthetic.json --config configs/fixture.json --output runs --port 8013
~~~

Open [http://127.0.0.1:8013](http://127.0.0.1:8013) and sign in. The API requires a valid session. The server binds to loopback and is intended for local use, not public or multi-user deployment.

Selecting “Remember me” keeps the session for up to 30 days. Otherwise, the session cookie is cleared when the browser closes and expires after at most 12 hours.

If the administrator password is lost, reset it using the same output directory:

~~~powershell
nexolab --reset-admin-password --output runs
~~~

This prompts for a new password and revokes existing sessions.

## Run an evaluation from the CLI

A fixture run exercises the complete run and report workflow without contacting Nexora:

~~~powershell
nexolab --suite datasets/persian.synthetic.json --config configs/fixture.json --output runs
~~~

Exit code 0 means every request succeeded, 1 means at least one test case failed, and 2 indicates invalid input or configuration.

## Connect Nexora

Copy the example configuration:

~~~powershell
Copy-Item configs/nexora.example.json configs/nexora.local.json
~~~

Set base_url, and scope the run to the test corpus by setting request.document_set_id or request.document_ids in the local configuration. The documents must already be uploaded and indexed in Nexora. NexoLab does not upload documents. Local test-suite document IDs and Nexora document IDs are separate identifiers; do not substitute one for the other.

Set NEXORA_TOKEN in the environment of the NexoLab process, then run:

~~~powershell
nexolab --suite datasets/persian.synthetic.json --config configs/nexora.local.json --output runs
~~~

For Windows, scripts/start-nexora.ps1 can prompt for the token once and store it encrypted with DPAPI for the current Windows account at %LOCALAPPDATA%\NexoLab\nexora-token.dpapi. Use scripts/start-nexora.ps1 -ResetToken to replace it or scripts/start-nexora.ps1 -ForgetToken to remove it. The encrypted token file is outside the repository. A manually started CLI still requires NEXORA_TOKEN in its process environment.


Set system_revision and corpus_revision in the configuration to the actual application/deployment and indexed-corpus revisions. Obtain these values from the service owner; NexoLab does not verify them. Do not guess a model version when the API does not provide one.

## Automatic evaluation

When expected_document_ids is set for a test case, each successful response receives deterministic metrics:

- document_recall: the fraction of expected documents returned in sources.
- citation_precision: the fraction of cited documents that are expected sources.
- citation_recall: the fraction of expected documents included in citations.
- citation_f1: the harmonic mean of citation precision and recall.

These metrics compare document IDs. They do not determine whether the answer is semantically correct or whether each citation supports the specific claim.

To enable DeepEval's semantic judges, install the optional extra and explicitly enable the engine:

~~~powershell
python -m pip install -e ".[evaluation]"
$env:NEXOLAB_EVALUATION_ENGINE = "deepeval"
$env:OPENAI_API_KEY = "your evaluator provider key"
~~~

DeepEval evaluates answer_correctness against the reference answer and, when source text is returned, faithfulness against the retrieved context. The example uses the provider key expected by DeepEval (OpenAI by default). Configure the evaluator provider according to DeepEval's documentation if using another supported model.

Enabling DeepEval sends each test question, generated answer, reference answer, and returned source text to the configured evaluator model. This may incur API charges. Do not enable it for sensitive data unless the provider and data-processing policy are approved for that data. Without NEXOLAB_EVALUATION_ENGINE=deepeval, no external evaluation-model call is made.

Automatic metrics are saved under automatic_evaluation in report.json, included in the matching CSV column, and summarized on the Advanced Analysis page. Human reviews remain separate.

## Test suites

The Persian synthetic suite is in datasets/persian.synthetic.json; datasets/template.json is a template for new suites. Suites have a version in X.Y.Z format. Each case can include a category, a difficulty (easy, medium, or hard), and tags. The interface can filter cases by category and difficulty.

The suite manager in the dashboard can create, edit, validate, and select suites. Validation reports structural errors and warnings such as duplicate questions, missing labels, or references to unknown documents. Each run stores a snapshot of the suite as it existed when the run started. expected_document_ids are local evaluation labels and are never sent to the Nexora API. Per-case request values override the shared request settings.

Never put credentials in a suite, question, document, revision, or filter.

## Reports and reproducibility

Each run is stored in its own UUID-named directory and produces report.json, report.csv, and report.md. The CSV uses a UTF-8 BOM for spreadsheet compatibility and escapes potentially executable spreadsheet values.

The JSON report stores the test-suite snapshot, effective per-case requests, full responses, automatic metric results, latency, and errors. It also records the suite SHA-256, a normalized configuration SHA-256, Python version, platform, and optional revision identifiers. Set NEXOLAB_REVISION to the code commit identifier before running if you want it recorded.

The Markdown report summarizes successful and failed requests, successful answers without sources or citations, latency statistics, and error categories. It also compares the run with the latest completed run that used the same suite and adapter.

A checkpoint is written after each case. The CSV and completion timestamp are written only when the run finishes. NexoLab continues after authentication or authorization failures, rate limits, timeouts, interrupted or incomplete responses, and invalid responses. HTTP 429 responses preserve a valid Retry-After value, but NexoLab does not retry automatically so each case makes exactly one request. A run can be started again after the indicated delay.

## Compare runs

In the Runs page, select two completed runs and open the comparison. NexoLab shows changes to answers, sources, errors, per-case latency, and suite/configuration fingerprints. The local endpoint GET /api/compare?baseline={run_id}&candidate={run_id} returns the same structured comparison.

This comparison identifies changes; it does not calculate an overall quality score. Incomplete runs cannot be compared.

## Human review

The Manual Evaluation page lets reviewers score each answer from 1 to 4 for correctness, relevance, source adequacy, and citation quality. The criteria are explained beside the review form.

Reviewer name, timestamp, and review history are stored in reviews.json inside the run directory, separately from the original reports. Review records can be downloaded from the interface. Clearing a review does not change report.json or report.csv.

## Develop the frontend

The React frontend source is in frontend/. Its build output is written to ui/, which the Python server serves from the same origin.

~~~powershell
cd frontend
npm ci
npm run build
cd ..
~~~

For live frontend development, run the Python API server in one terminal and start Vite in another:

~~~powershell
cd frontend
npm run dev
~~~

Vite serves the interface at [http://127.0.0.1:5173](http://127.0.0.1:5173) and proxies /api requests to the Python server. Opening index.html directly or using python -m http.server is not sufficient because the interface requires the API.

## Security and privacy

- The local web server listens only on 127.0.0.1; it is not a public or multi-user service.
- The API requires an authenticated administrator session. Host, Origin, and a dedicated request header are checked for mutating requests.
- Nexora credentials are read from the server process environment. The browser never receives or stores the token.
- The configured Bearer token is redacted from JSON and CSV report values, including if it is echoed in a question or response. HTTP error bodies from Nexora are not stored.
- Reports can contain private questions, document text, answers, and citations. Review them before sharing. Token redaction is not general-purpose redaction of sensitive content.
- Local configuration files, .env files, and runs/ are ignored by Git.

## CI and tests

Continuous integration runs the Python test suite and a fixture evaluation on Python 3.11 through 3.14 without connecting to Nexora.

Run the test suite locally with:

~~~powershell
python -m unittest discover -s tests -v
~~~

## Project documentation

- [Connected web interface](ui/README.md)
- [Architecture](docs/architecture.md)
