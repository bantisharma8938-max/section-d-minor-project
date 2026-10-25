const students = [
			{ id: "80421", name: "Ava Johnson", time: "8:04 AM", status: "Present" },
			{ id: "80422", name: "Noah Williams", time: "8:07 AM", status: "Present" },
			{ id: "80423", name: "Mia Chen", time: "8:01 AM", status: "Present" },
			{ id: "80424", name: "Ethan Patel", time: "8:19 AM", status: "Late" },
			{ id: "80425", name: "Sofia Garcia", time: "—", status: "Absent" },
			{ id: "80426", name: "Oliver Brown", time: "—", status: "Absent" }
		];
		const allowedStatuses = ["Present", "Late", "Absent"];
		const storageKey = "classroom-demo-attendance-v1";
		const savedStatuses = JSON.parse(localStorage.getItem(storageKey) || "{}");
		students.forEach((student) => {
			if (allowedStatuses.includes(savedStatuses[student.id])) student.status = savedStatuses[student.id];
		});

		const rosterBody = document.querySelector("#roster-body");
		const searchInput = document.querySelector("#student-search");
		const toast = document.querySelector("#toast");
		const loginForm = document.querySelector("#login-form");
		const loginScreen = document.querySelector("#login-screen");
		const attendanceApp = document.querySelector("#attendance-app");
		const accountControls = document.querySelector("#account-controls");
		const accountRole = document.querySelector("#account-role");
		const todayLabel = document.querySelector("#today");
		const loginStatus = document.querySelector("#login-status");
		const loginRoleButtons = document.querySelectorAll("[data-login-role]");
		const cameraConsent = document.querySelector("#camera-consent");
		const cameraStage = document.querySelector("#camera-stage");
		const cameraVideo = document.querySelector("#camera-video");
		const captureCanvas = document.querySelector("#capture-canvas");
		const cameraStatus = document.querySelector("#camera-status");
		const startCameraButton = document.querySelector("#start-camera");
		const captureButton = document.querySelector("#capture-face");
		const stopCameraButton = document.querySelector("#stop-camera");
		const retakeButton = document.querySelector("#retake-capture");
		const finishCaptureButton = document.querySelector("#finish-capture");
		let cameraStream = null;
		let toastTimer;
		let selectedLoginRole = "teacher";

		function setCameraStatus(message, state = "") {
			cameraStatus.textContent = message;
			cameraStatus.dataset.state = state;
		}

		function stopCamera() {
			cameraStream?.getTracks().forEach((track) => track.stop());
			cameraStream = null;
			cameraVideo.srcObject = null;
			cameraStage.hidden = true;
			cameraVideo.hidden = true;
			captureButton.hidden = true;
			stopCameraButton.hidden = true;
			startCameraButton.hidden = false;
		}

		function clearCapture() {
			const context = captureCanvas.getContext("2d");
			context?.clearRect(0, 0, captureCanvas.width, captureCanvas.height);
			captureCanvas.width = 0;
			captureCanvas.height = 0;
			captureCanvas.hidden = true;
			retakeButton.hidden = true;
			finishCaptureButton.hidden = true;
			startCameraButton.hidden = false;
			cameraStage.hidden = true;
			cameraConsent.checked = false;
			startCameraButton.disabled = true;
		}

		async function startCamera() {
			if (!cameraConsent.checked) return;
			if (!navigator.mediaDevices?.getUserMedia) {
				setCameraStatus("Camera access is unavailable here. Use HTTPS or localhost, or ask your teacher to record attendance.", "error");
				return;
			}
			startCameraButton.disabled = true;
			setCameraStatus("Waiting for camera permission...");
			try {
				cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
				cameraVideo.srcObject = cameraStream;
				cameraStage.hidden = false;
				cameraVideo.hidden = false;
				startCameraButton.hidden = true;
				captureButton.hidden = false;
				stopCameraButton.hidden = false;
				setCameraStatus("Live preview is on. Capture only when ready.");
			} catch {
				startCameraButton.disabled = !cameraConsent.checked;
				setCameraStatus("Camera permission was denied or no camera is available. You can ask your teacher to record attendance.", "error");
			}
		}

		function captureFace() {
			if (!cameraStream || !cameraVideo.videoWidth || !cameraVideo.videoHeight) {
				setCameraStatus("The camera is not ready yet. Wait for the preview and try again.", "error");
				return;
			}
			captureCanvas.width = cameraVideo.videoWidth;
			captureCanvas.height = cameraVideo.videoHeight;
			captureCanvas.getContext("2d").drawImage(cameraVideo, 0, 0);
			stopCamera();
			cameraStage.hidden = false;
			captureCanvas.hidden = false;
			startCameraButton.hidden = true;
			retakeButton.hidden = false;
			finishCaptureButton.hidden = false;
			setCameraStatus("Snapshot captured in this page only. Identity is not verified; attendance is not yet marked.");
		}

		cameraConsent.addEventListener("change", () => {
			startCameraButton.disabled = !cameraConsent.checked;
			if (!cameraConsent.checked) {
				stopCamera();
				clearCapture();
				setCameraStatus("Consent withdrawn. Camera stopped and snapshot cleared.");
			}
		});
		startCameraButton.addEventListener("click", startCamera);
		captureButton.addEventListener("click", captureFace);
		stopCameraButton.addEventListener("click", () => {
			stopCamera();
			setCameraStatus("Camera stopped. No image was captured.");
		});
		retakeButton.addEventListener("click", () => {
			clearCapture();
			setCameraStatus("Snapshot cleared. Give consent again to restart the camera.");
		});
		finishCaptureButton.addEventListener("click", () => {
			clearCapture();
			setCameraStatus("Capture finished and cleared. Ask your teacher to confirm your identity and record attendance.", "success");
		});

		function initials(name) {
			return name.split(" ").map((part) => part[0]).slice(0, 2).join("");
		}

		function renderRoster() {
			const query = searchInput.value.trim().toLowerCase();
			const visibleStudents = students.filter((student) => `${student.name} ${student.id}`.toLowerCase().includes(query));
			rosterBody.replaceChildren();
			visibleStudents.forEach((student) => {
				const row = document.createElement("tr");
				const nameCell = document.createElement("td");
				const identity = document.createElement("div");
				identity.className = "student-cell";
				const avatar = document.createElement("span");
				avatar.className = "avatar";
				avatar.textContent = initials(student.name);
				const name = document.createElement("span");
				name.className = "student-name";
				name.textContent = student.name;
				identity.append(avatar, name);
				nameCell.append(identity);

				const idCell = document.createElement("td");
				idCell.textContent = student.id;
				const timeCell = document.createElement("td");
				timeCell.textContent = student.status === "Absent" ? "—" : student.time;
				const statusCell = document.createElement("td");
				const select = document.createElement("select");
				select.className = "status-select";
				select.setAttribute("aria-label", `Attendance status for ${student.name}`);
				allowedStatuses.forEach((status) => {
					const option = document.createElement("option");
					option.value = status;
					option.textContent = status;
					option.selected = student.status === status;
					select.append(option);
				});
				select.addEventListener("change", () => updateStatus(student, select.value));
				statusCell.append(select);
				row.append(nameCell, idCell, timeCell, statusCell);
				rosterBody.append(row);
			});
			document.querySelector("#empty-filter").hidden = visibleStudents.length !== 0;
			updateMetrics();
		}

		function updateMetrics() {
			const present = students.filter((student) => student.status === "Present").length;
			const late = students.filter((student) => student.status === "Late").length;
			const absent = students.filter((student) => student.status === "Absent").length;
			document.querySelector("#metric-enrolled").textContent = students.length;
			document.querySelector("#metric-present").textContent = present + late;
			document.querySelector("#metric-absent").textContent = absent;
			document.querySelector("#metric-rate").textContent = `${Math.round(((present + late) / students.length) * 100)}%`;
		}

		function updateStatus(student, status) {
			if (!allowedStatuses.includes(status)) return;
			student.status = status;
			localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(students.map((item) => [item.id, item.status]))));
			renderRoster();
			showToast(`${student.name}'s status updated to ${status.toLowerCase()}.`);
		}

		function showToast(message) {
			toast.textContent = message;
			toast.classList.add("show");
			clearTimeout(toastTimer);
			toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
		}

		function openDashboard(role) {
			const isTeacher = role === "teacher";
			loginScreen.hidden = true;
			attendanceApp.hidden = false;
			accountControls.hidden = false;
			todayLabel.hidden = false;
			accountRole.textContent = isTeacher ? "Teacher" : "Student";
			document.querySelector("#teacher-view").hidden = !isTeacher;
			document.querySelector("#student-view").hidden = isTeacher;
		}

		function signOut() {
			stopCamera();
			clearCapture();
			loginForm.reset();
			selectedLoginRole = "teacher";
			loginRoleButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.loginRole === selectedLoginRole)));
			loginStatus.textContent = "Demo only. No credentials are sent or stored.";
			loginStatus.dataset.state = "";
			loginScreen.hidden = false;
			attendanceApp.hidden = true;
			accountControls.hidden = true;
			todayLabel.hidden = true;
		}

		loginRoleButtons.forEach((button) => {
			button.addEventListener("click", () => {
				selectedLoginRole = button.dataset.loginRole;
				loginRoleButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
			});
		});
		loginForm.addEventListener("submit", (event) => {
			event.preventDefault();
			loginStatus.textContent = "Demo sign-in complete. Credentials were not sent or stored.";
			openDashboard(selectedLoginRole);
		});
		document.querySelector("#logout-button").addEventListener("click", signOut);
		searchInput.addEventListener("input", renderRoster);
		todayLabel.textContent = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date());
		window.addEventListener("pagehide", () => {
			stopCamera();
			clearCapture();
		});
		renderRoster();
