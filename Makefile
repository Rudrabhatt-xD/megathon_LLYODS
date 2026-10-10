# Green Home Score and Retrofit Engine. On Windows without make, use: python run.py <target>
PY ?= python

.PHONY: setup data prepare train evaluate portfolio predict-test llm-eval test test-all api app docs all clean

setup:
	$(PY) -m pip install -r requirements.txt

data:
	$(PY) scripts/generate_data.py

prepare:
	$(PY) scripts/prepare_data.py

train:
	$(PY) scripts/train_models.py

portfolio:
	$(PY) scripts/precompute_portfolio.py

evaluate:
	$(PY) scripts/evaluate.py

predict-test:
	$(PY) scripts/make_test_predictions.py

llm-eval:
	$(PY) scripts/run_llm_eval.py

test:
	$(PY) -m pytest -q -m "not live_llm" --junitxml=reports/junit.xml

test-all:
	$(PY) -m pytest -q --junitxml=reports/junit.xml

docs:
	$(PY) scripts/render_docs.py

api:
	$(PY) -m uvicorn api.main:app --port 8000

app:
	$(PY) -m streamlit run app/Home.py

all: data prepare train portfolio evaluate predict-test llm-eval test docs

clean:
	$(PY) run.py clean
