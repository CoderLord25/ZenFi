    // Kiểm tra MetaMask khi load trang
    window.addEventListener("load", () => {
      if (typeof window.ethereum === "undefined") {
        console.warn("MetaMask not found. Please install it to use Connect Wallet.");
      } else {
        console.log("MetaMask detected:", window.ethereum);
      }
    });

    function showLogin() {
      document.getElementById("step1").style.display = "none";
      document.getElementById("mintSuccess").style.display = "none";
      document.getElementById("loginForm").style.display = "block";
    }

    function mintZenID() {
      const chars = "abcdef0123456789";
      let addr = "0x";
      for (let i = 0; i < 40; i++) {
        addr += chars[Math.floor(Math.random() * chars.length)];
      }

      fetch("/register_zenid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zenid: addr })
      });

      document.getElementById("step1").style.display = "none";
      document.getElementById("loginForm").style.display = "none";
      document.getElementById("mintSuccess").style.display = "block";
      document.getElementById("generatedAddress").textContent = addr;
    }

    function backToLogin() {
      document.getElementById("mintSuccess").style.display = "none";
      document.getElementById("loginForm").style.display = "block";
      document.getElementById("zenidInput").value = document.getElementById("generatedAddress").textContent;
    }

    function login() {
      const zenid = document.getElementById("zenidInput").value;
      if (zenid.trim() === "") {
        alert("Please enter your ZenID address!");
        return;
      }
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/login";
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "zenid";
      input.value = zenid;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    }

    // Hàm Connect Wallet đã sửa
    async function connectWallet() {
      if (typeof window.ethereum === "undefined") {
        alert("MetaMask chưa được cài hoặc chưa bật trên trình duyệt!");
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (!accounts || accounts.length === 0) {
          alert("Không tìm thấy tài khoản ví nào!");
          return;
        }

        const walletAddress = accounts[0];
        console.log("Connected wallet:", walletAddress);

        // Hiện modal thay vì alert
        document.getElementById("walletAddress").textContent = walletAddress;
        document.getElementById("walletModal").style.display = "block";
        setTimeout(() => {
          window.location.href = "/";  // hoặc url_for('mint_page')
        }, 5000);
        // Close modal
        document.getElementById("closeModal").onclick = function() {
          document.getElementById("walletModal").style.display = "none";
        };

        // Gửi địa chỉ ví về server để login
        const res = await fetch("/wallet_login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: walletAddress })
        });

        const data = await res.json();
        if (data.success) {
          window.location.href = "/mint_page";
        }
      } catch (err) {
        console.error("Connect wallet error:", err);
        alert("Kết nối ví thất bại hoặc bạn đã từ chối!");
      }
    }