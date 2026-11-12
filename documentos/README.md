# Documentos del Trabajo Final

Sistema de Gestión de Stock para la Farmacia de un Hospital Público.
Trabajo Final Integrador de la Tecnicatura Universitaria en Programación (UTN).

Esta carpeta junta **todo lo que se entrega y todo lo que hace falta para defender el trabajo**.
El código está en `backend/` y `frontend/`; la documentación técnica de trabajo (la que se fue
escribiendo mientras se programaba) está en `docs/`. Acá está la versión ordenada para presentar.

## Qué hay en cada carpeta

| Carpeta | Para quién | Qué tiene |
|---|---|---|
| [`tesis/`](tesis/) | Tribunal evaluador | El **informe final** (la "tesis"): problema, objetivos, marco teórico, análisis, diseño, implementación, pruebas, conclusiones y bibliografía. |
| [`carpeta-del-proyecto/`](carpeta-del-proyecto/) | Docentes y quien mantenga el sistema | La **carpeta técnica**: requisitos, casos de uso, arquitectura, diccionario de datos, API, seguridad, plan de pruebas, instalación, planificación y presupuesto, glosario. |
| [`manual-de-usuario/`](manual-de-usuario/) | El personal de la farmacia | Cómo se usa el sistema pantalla por pantalla, según el rol, con preguntas frecuentes y qué hacer ante cada mensaje de error. |
| [`defensa/`](defensa/) | Quien presenta | Guion de la presentación oral, guion de la demostración en vivo y las preguntas probables del tribunal con sus respuestas. |
| [`estudio/`](estudio/) | Quien tiene que entender el proyecto desde cero | **Todo explicado desde lo más básico**: qué es un servidor, una base de datos, Java, Spring, React, JWT, Docker, tests… y después cómo se usa cada cosa en este proyecto, con ejemplos del código real. |

## Por dónde empezar

- **Si tenés que defender el trabajo y no te acordás de nada:** empezá por
  [`estudio/00-como-usar-esta-carpeta.md`](estudio/00-como-usar-esta-carpeta.md). Tiene un plan
  de lectura por días.
- **Si tenés que entregar el informe:** [`tesis/informe-final.md`](tesis/informe-final.md).
  Completá los datos marcados con `[COMPLETAR]` (nombre, legajo, docente, fecha de entrega).
- **Si vas a usar el sistema:** [`manual-de-usuario/manual-de-usuario.md`](manual-de-usuario/manual-de-usuario.md).
- **Si vas a instalarlo:** [`carpeta-del-proyecto/08-instalacion-y-despliegue.md`](carpeta-del-proyecto/08-instalacion-y-despliegue.md).

## Datos a completar antes de entregar

Buscá `[COMPLETAR]` en toda la carpeta (en VS Code: `Ctrl + Shift + F`). Son solo los datos
personales y administrativos que el sistema no puede saber: nombre y apellido, legajo, comisión,
docente o tutor, y fecha de entrega.

## Cómo pasarlo a Word o PDF

Los documentos están en Markdown (`.md`) porque se leen bien en GitHub, en VS Code y se pueden
versionar con git. Para entregar en papel o en el campus:

- **Con VS Code:** instalá la extensión *Markdown PDF* (yzane.markdown-pdf), abrí el archivo y
  `Ctrl + Shift + P` → "Markdown PDF: Export (pdf)".
- **Con Pandoc** (si lo tenés instalado), desde esta carpeta:
  `pandoc tesis/informe-final.md -o informe-final.docx`
- Los diagramas están escritos en **Mermaid** (bloques ` ```mermaid `). GitHub y VS Code (con la
  extensión *Markdown Preview Mermaid Support*) los dibujan; para Word conviene exportarlos como
  imagen desde https://mermaid.live.

Las capturas de pantalla del sistema están en `docs/capturas/` y se regeneran con
`npm run capturas` desde `frontend/`.
