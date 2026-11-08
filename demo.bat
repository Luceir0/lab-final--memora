@echo off
rem ===========================================================================
rem  Memora - arranque de la demo local para Windows
rem
rem  Uso:
rem    demo.bat            Prepara el entorno y abre API y web en dos ventanas.
rem    demo.bat fast       Igual, pero sin migraciones, seed ni imagenes.
rem    demo.bat single     Un solo proceso (pnpm dev) en vez de dos ventanas.
rem    demo.bat fast single
rem
rem  Requisitos: Docker Desktop, Node 24+ y pnpm 10 (o corepack).
rem  No imprime secretos: solo estados, URLs y las credenciales de demo.
rem ===========================================================================

setlocal DisableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

set "FAST=0"
set "SINGLE=0"

:parse_args
if "%~1"=="" goto args_done
if /i "%~1"=="fast" set "FAST=1"
if /i "%~1"=="single" set "SINGLE=1"
if /i "%~1"=="help" goto usage
if /i "%~1"=="-h" goto usage
if /i "%~1"=="--help" goto usage
shift
goto parse_args
:args_done

echo.
echo ============================================================
echo   Memora - demo local
echo ============================================================
echo.

rem ---------------------------------------------------------------------------
rem 0. Herramientas
rem ---------------------------------------------------------------------------
set "PNPM=pnpm"
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] No se encuentra Node.js 24 o superior en el PATH.
  goto fail
)
where pnpm >nul 2>&1
if errorlevel 1 (
  where corepack >nul 2>&1
  if errorlevel 1 (
    echo [ERROR] No se encuentra pnpm ni corepack. Instala Node 24 y ejecuta:
    echo         corepack enable
    goto fail
  )
  set "PNPM=corepack pnpm"
  echo [aviso] pnpm no esta en el PATH; se usara "corepack pnpm".
)

rem ---------------------------------------------------------------------------
rem 1. Docker y contenedores
rem ---------------------------------------------------------------------------
echo [1/8] Comprobando Docker...
docker info >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker no responde. Abre Docker Desktop y espera a que termine
  echo         de arrancar; despues vuelve a ejecutar demo.bat.
  goto fail
)

echo [2/8] Levantando PostgreSQL, Silo y Mailpit...
call docker compose up -d
if errorlevel 1 (
  echo [ERROR] "docker compose up -d" ha fallado. Revisa el mensaje anterior.
  goto fail
)

echo [3/8] Esperando a que los tres servicios esten "healthy"...
set /a WAIT=0
:wait_health
set "NOT_HEALTHY="
for %%S in (postgres minio mailpit) do call :check_service %%S
if not defined NOT_HEALTHY goto health_ok
if %WAIT% GEQ 120 (
  echo [ERROR] Los servicios no han llegado a "healthy" en 120 s.
  echo         Revisa "docker compose ps" y los logs del servicio que falla.
  goto fail
)
"%SystemRoot%\System32\ping.exe" -n 3 127.0.0.1 >nul 2>&1
set /a WAIT+=2
goto wait_health

:health_ok
echo       Los tres servicios estan healthy.
echo.

rem ---------------------------------------------------------------------------
rem 2. Dependencias
rem ---------------------------------------------------------------------------
echo [4/8] Comprobando dependencias...
if not exist "node_modules" (
  echo       node_modules no existe; instalando con el lockfile...
  call %PNPM% install --frozen-lockfile
  if errorlevel 1 (
    echo [ERROR] "pnpm install --frozen-lockfile" ha fallado.
    goto fail
  )
) else (
  echo       node_modules presente.
)

rem ---------------------------------------------------------------------------
rem 3. Variables de entorno (nunca se imprimen valores)
rem ---------------------------------------------------------------------------
echo [5/8] Cargando variables de entorno...
if not exist ".env.example" (
  echo [ERROR] Falta .env.example en la raiz del repositorio.
  goto fail
)
call :load_env ".env.example"
if exist ".env" (
  echo       .env detectado: sus valores sobrescriben los del ejemplo.
  call :load_env ".env"
) else (
  echo       Sin .env: se usan los valores locales de .env.example.
)
if not defined DATABASE_URL (
  echo [ERROR] DATABASE_URL ha quedado vacia. Revisa .env.example o tu .env.
  goto fail
)
if not defined SESSION_SECRET (
  for /f "delims=" %%S in ('node -p "require('node:crypto').randomBytes(32).toString('base64url')"') do set "SESSION_SECRET=%%S"
)
if not defined SESSION_SECRET (
  echo [ERROR] No se ha podido generar SESSION_SECRET.
  goto fail
)
if not defined S3_BUCKET set "S3_BUCKET=memora"
if not defined MINIO_ROOT_USER set "MINIO_ROOT_USER=memora"
if not defined MINIO_ROOT_PASSWORD set "MINIO_ROOT_PASSWORD=memora123"
echo       Variables listas (los valores no se muestran).

rem ---------------------------------------------------------------------------
rem 4. Bucket privado
rem ---------------------------------------------------------------------------
echo [6/8] Comprobando el bucket privado "%S3_BUCKET%"...
call docker compose exec -T minio mc alias set local http://127.0.0.1:9000 "%MINIO_ROOT_USER%" "%MINIO_ROOT_PASSWORD%" >nul 2>&1
if errorlevel 1 (
  echo [ERROR] No se ha podido configurar el cliente "mc" dentro de Silo.
  goto fail
)
call docker compose exec -T minio mc mb --ignore-existing "local/%S3_BUCKET%" >nul 2>&1
if errorlevel 1 (
  echo [ERROR] No se ha podido crear el bucket "%S3_BUCKET%".
  goto fail
)
echo       Bucket preparado.

rem ---------------------------------------------------------------------------
rem 5. Base de datos: cliente Prisma, migraciones y seed
rem ---------------------------------------------------------------------------
echo [7/8] Preparando la base de datos...
call %PNPM% --filter @memora/api db:generate
if errorlevel 1 (
  echo [ERROR] "prisma generate" ha fallado.
  goto fail
)
if "%FAST%"=="1" (
  echo       Modo fast: se saltan migraciones, seed e imagenes.
) else (
  echo       Aplicando migraciones, seed e imagenes...
  call %PNPM% --filter @memora/api db:migrate:deploy
  if errorlevel 1 (
    echo [ERROR] "prisma migrate deploy" ha fallado.
    goto fail
  )
  call %PNPM% db:seed
  if errorlevel 1 (
    echo [ERROR] "pnpm db:seed" ha fallado.
    goto fail
  )
  call %PNPM% db:seed:images
  if errorlevel 1 (
    echo [ERROR] "pnpm db:seed:images" ha fallado.
    goto fail
  )
)

rem Los paquetes del workspace se consumen desde dist: hay que compilarlos
rem antes de arrancar los servidores por separado.
echo       Compilando paquetes compartidos...
call %PNPM% exec turbo build --filter=@memora/shared --filter=@memora/ui --filter=@memora/api-client
if errorlevel 1 (
  echo [ERROR] No se han podido compilar los paquetes compartidos.
  goto fail
)

rem ---------------------------------------------------------------------------
rem 6. Arranque
rem ---------------------------------------------------------------------------
echo.
echo [8/8] Arrancando la aplicacion...
call :http_code "http://127.0.0.1:3001/api/health"
if "%HTTP_CODE%"=="200" (
  echo [aviso] Ya hay una API respondiendo en el puerto 3001.
  echo         Cierra la ventana "Memora API" de una demo anterior y vuelve a ejecutar.
  goto fail
)
call :http_code "http://localhost:3000/login"
if "%HTTP_CODE%"=="200" (
  echo [aviso] Ya hay una web respondiendo en el puerto 3000.
  echo         Cierra la ventana "Memora web" de una demo anterior y vuelve a ejecutar.
  goto fail
)
if "%SINGLE%"=="1" (
  start "Memora" cmd /k "call %PNPM% dev"
) else (
  start "Memora API" cmd /k "call %PNPM% --filter @memora/api dev"
  start "Memora web" cmd /k "call %PNPM% --filter @memora/web dev"
)

set /a WAIT=0
:verify
call :http_code "http://127.0.0.1:3001/api/health"
set "API_CODE=%HTTP_CODE%"
call :http_code "http://localhost:3000/login"
set "WEB_CODE=%HTTP_CODE%"
if "%API_CODE%"=="200" if "%WEB_CODE%"=="200" goto ready
if %WAIT% GEQ 90 goto verify_fail
"%SystemRoot%\System32\ping.exe" -n 4 127.0.0.1 >nul 2>&1
set /a WAIT+=3
echo       esperando... API %API_CODE%, web %WEB_CODE% ^(%WAIT% s^)
goto verify

:verify_fail
echo.
echo [ERROR] La API o la web no responden tras 90 s.
echo         API %API_CODE% en http://127.0.0.1:3001/api/health
echo         Web %WEB_CODE% en http://localhost:3000/login
echo         Mira las ventanas "Memora API" y "Memora web" para ver el error.
goto fail

:ready
echo.
echo ============================================================
echo   Demo lista
echo ============================================================
echo.
echo   Web:      http://localhost:3000/login
echo   Mailpit:  http://localhost:8025
echo   API:      http://localhost:3001/api/health
echo.
echo   Usuarios (contrasena "memora-demo"):
echo     lucia@memora.test  - owner en Familia Ferrer y Danza
echo     mateo@memora.test  - member; en Danza solo lectura
echo.
echo   Para parar: cierra las ventanas "Memora API" y "Memora web"
echo   (o pulsa Ctrl+C en cada una). Los contenedores siguen arriba:
echo     docker compose stop
echo.
start "" "http://localhost:3000/login"
start "" "http://localhost:8025"
echo   Se han abierto el navegador y Mailpit.
echo.
rem MEMORA_DEMO_NO_PAUSE=1 permite ejecuciones no interactivas (CI/agente).
if not defined MEMORA_DEMO_NO_PAUSE pause
goto :eof

rem ---------------------------------------------------------------------------
rem Subrutinas
rem ---------------------------------------------------------------------------

:check_service
rem %1 = nombre del servicio en docker-compose.yml
set "SVC=%~1"
set "CID="
for /f "delims=" %%C in ('docker compose ps -q %SVC% 2^>nul') do set "CID=%%C"
if not defined CID (
  echo       - %SVC%: sin contenedor
  set "NOT_HEALTHY=1"
  exit /b 0
)
set "STATUS="
for /f "delims=" %%H in ('docker inspect --format "{{.State.Health.Status}}" %CID% 2^>nul') do set "STATUS=%%H"
if /i "%STATUS%"=="healthy" (
  echo       - %SVC%: healthy
  exit /b 0
)
echo       - %SVC%: %STATUS%
set "NOT_HEALTHY=1"
exit /b 0

:load_env
rem %1 = ruta del archivo; ignora comentarios, lineas vacias y claves no validas
for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%~1") do call :set_env "%%A" "%%B"
exit /b 0

:set_env
rem %1 = clave, %2 = valor (puede contener espacios)
if "%~1"=="" exit /b 0
set "%~1=%~2"
exit /b 0

:http_code
rem %1 = URL; deja el codigo HTTP en HTTP_CODE (0 si no responde)
set "HTTP_CODE=0"
for /f "delims=" %%C in ('node -e "fetch('%~1',{signal:AbortSignal.timeout(2000)}).then(function(r){console.log(r.status)}).catch(function(){console.log(0)})"') do set "HTTP_CODE=%%C"
exit /b 0

:usage
echo.
echo Uso: demo.bat [fast] [single]
echo   fast     se salta migraciones, seed e imagenes
echo   single   un solo proceso (pnpm dev) en vez de API y web separadas
echo.
goto :eof

:fail
echo.
echo La demo no se ha podido preparar. Revisa el mensaje anterior.
echo Para parar lo que ya este en marcha: cierra las ventanas "Memora*".
echo.
if not defined MEMORA_DEMO_NO_PAUSE pause
exit /b 1
