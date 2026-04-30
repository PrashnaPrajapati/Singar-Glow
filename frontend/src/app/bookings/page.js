"use client";

import { apiUrl } from "@/lib/apiConfig";
import { getValidToken } from "@/lib/authStorage";
import { getEsewaPaymentUrl, normalizeEsewaAmount } from "@/lib/esewa";
import { CalendarDays, CheckCircle2, Clock3, CreditCard, MapPin } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

const timeSlots = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const salonAddress = "Singar Glow Salon";
const homeServiceRate = 0.1;

function formatDateLabel(value) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function BookingStep({ number, label, active, complete }) {
  return (
    <div className="flex flex-1 items-center gap-2 sm:flex-none sm:gap-6">
      <div className="flex min-w-0 flex-col items-center gap-2 sm:gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold sm:h-14 sm:w-14 sm:text-lg ${
            active || complete
              ? "bg-gradient-to-br from-pink-500 to-purple-500 text-white"
              : "bg-gray-200 text-gray-500"
          }`}
        >
          {number}
        </div>
        <span className={`text-center text-xs font-semibold sm:text-base ${active ? "text-gray-950" : "text-gray-500"}`}>{label}</span>
      </div>
      {number < 3 && (
        <div className={`mb-7 h-1 flex-1 sm:mb-9 sm:w-24 ${complete ? "bg-pink-500" : "bg-gray-200"}`} />
      )}
    </div>
  );
}

function BookingSummary({ item, date, time, locationType, total, duration, bookingType }) {
  const itemLabel = bookingType === "package" ? "Package" : "Service";

  return (
    <aside className="rounded-lg border border-rose-100 bg-white p-7 shadow-sm">
      <h2 className="mb-8 text-2xl font-bold text-gray-950">Booking Summary</h2>
      <div className="space-y-5 text-lg">
        <div className="flex justify-between gap-6">
          <span className="text-gray-500">{itemLabel}</span>
          <span className="text-right font-bold text-gray-950">{item?.name || "-"}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-gray-500">Duration</span>
          <span className="font-bold text-gray-950">{duration ? `${duration} min` : "-"}</span>
        </div>
        {date && (
          <div className="flex justify-between gap-6">
            <span className="text-gray-500">Date</span>
            <span className="font-bold text-gray-950">{new Date(`${date}T00:00:00`).toLocaleDateString("en-GB")}</span>
          </div>
        )}
        {time && (
          <div className="flex justify-between gap-6">
            <span className="text-gray-500">Time</span>
            <span className="font-bold text-gray-950">{time}</span>
          </div>
        )}
        <div className="flex justify-between gap-6">
          <span className="text-gray-500">Location</span>
          <span className="font-bold text-gray-950">
            {locationType === "home" ? "Home" : locationType === "salon" ? "Salon" : "-"}
          </span>
        </div>
      </div>
      <hr className="my-7 border-rose-100" />
      <div className="space-y-5 text-lg">
        <div className="flex justify-between">
          <span className="text-gray-500">{itemLabel} Price</span>
          <span className="text-gray-950">Rs. {Number(item?.price || 0).toFixed(2)}</span>
        </div>
        {locationType === "home" && (
          <div className="flex justify-between">
            <span className="text-gray-500">Home Service (10%)</span>
            <span className="text-gray-950">Rs. {(Number(item?.price || 0) * homeServiceRate).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-rose-100 pt-5 text-2xl font-bold">
          <span className="text-gray-950">Total</span>
          <span className="text-pink-600">Rs. {Number(total || 0).toFixed(2)}</span>
        </div>
      </div>
    </aside>
  );
}

function BookingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceIdFromQuery = Number(searchParams.get("serviceId") || 0);
  const packageIdFromQuery = Number(searchParams.get("packageId") || 0);

  const [isOpen, setIsOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [step, setStep] = useState(1);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [locationType, setLocationType] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("esewa");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); 
  const socketRef = useRef(null);
  const dateRef = useRef("");
  const heldSlotRef = useRef(null);

  const token = getValidToken();
  const bookingType = packageIdFromQuery ? "package" : "service";

  const releaseHeldSlot = useCallback(() => {
    const heldSlot = heldSlotRef.current;
    if (!heldSlot || !socketRef.current) return;

    socketRef.current.emit("release_booking_slot", heldSlot);
    heldSlotRef.current = null;
  }, []);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(apiUrl("/services"))
      .then((res) => res.json())
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => setServices([]));

    fetch(apiUrl("/packages"))
      .then((res) => res.json())
      .then((data) => setPackages(Array.isArray(data) ? data : []))
      .catch(() => setPackages([]));
  }, [router, token]);

  useEffect(() => {
    if (!date) {
      setBookedSlots([]);
      return;
    }

    fetch(apiUrl(`/bookings/booked-slots?date=${date}`))
      .then((res) => res.json())
      .then((data) => setBookedSlots(Array.isArray(data) ? data : []))
      .catch(() => setBookedSlots([]));
  }, [date]);

  useEffect(() => {
    dateRef.current = date;
  }, [date]);

  useEffect(() => {
    const bookingSocket = io(apiUrl(""));
    socketRef.current = bookingSocket;

    const addBlockedSlot = ({ date: eventDate, slot }) => {
      if (eventDate !== dateRef.current || !slot) return;
      setBookedSlots((current) => (current.includes(slot) ? current : [...current, slot]));
    };

    const removeBlockedSlot = ({ date: eventDate, slot }) => {
      if (eventDate !== dateRef.current || !slot) return;
      setBookedSlots((current) => current.filter((item) => item !== slot));
    };

    const handleHoldFailed = ({ date: eventDate, slot }) => {
      if (eventDate !== dateRef.current || heldSlotRef.current?.slot !== slot) return;

      heldSlotRef.current = null;
      setTime("");
      setBookedSlots((current) => (current.includes(slot) ? current : [...current, slot]));
      setErrorMessage("That time slot was just selected by another customer. Please choose another time.");
    };

    bookingSocket.on("booking_slot_held", addBlockedSlot);
    bookingSocket.on("booking_slot_booked", addBlockedSlot);
    bookingSocket.on("booking_slot_released", removeBlockedSlot);
    bookingSocket.on("booking_slot_hold_failed", handleHoldFailed);

    return () => {
      releaseHeldSlot();
      bookingSocket.off("booking_slot_held", addBlockedSlot);
      bookingSocket.off("booking_slot_booked", addBlockedSlot);
      bookingSocket.off("booking_slot_released", removeBlockedSlot);
      bookingSocket.off("booking_slot_hold_failed", handleHoldFailed);
      bookingSocket.disconnect();
      socketRef.current = null;
    };
  }, [releaseHeldSlot]);

  useEffect(() => {
    const bookingSocket = socketRef.current;
    if (!bookingSocket || !date) return;

    bookingSocket.emit("join_booking_date", { date });

    return () => {
      bookingSocket.emit("leave_booking_date", { date });
    };
  }, [date]);

  const selectedItem = useMemo(() => {
    if (bookingType === "package") {
      return packages.find((item) => item.id === packageIdFromQuery);
    }
    return services.find((item) => item.id === serviceIdFromQuery);
  }, [bookingType, packageIdFromQuery, packages, serviceIdFromQuery, services]);

  const duration = useMemo(() => {
    if (!selectedItem) return 0;
    if (bookingType === "package") {
      return Number(String(selectedItem.duration || "").replace(/\D/g, ""));
    }
    return Number(String(selectedItem.duration || "").replace(/\D/g, ""));
  }, [bookingType, selectedItem]);

  const basePrice = Number(selectedItem?.price || 0);
  const homeServiceCharge = locationType === "home" ? basePrice * homeServiceRate : 0;
  const totalPrice = basePrice + homeServiceCharge;

  const todayValue = new Date().toISOString().split("T")[0];
  const filteredTimeSlots = timeSlots.filter((slot) => {
    if (!date) return true;
    const selectedDate = new Date(`${date}T00:00:00`);
    const today = new Date();
    if (selectedDate.toDateString() !== today.toDateString()) return true;
    return Number(slot.split(":")[0]) > today.getHours();
  });

  const startEsewaPayment = async (bookingIds) => {
    const transactionUuid = `TXN${Date.now()}`;
    const paymentAmount = normalizeEsewaAmount(totalPrice);
    const successUrl = `${window.location.origin}/payments/esewa-callback`;
    const failUrl = `${window.location.origin}/payments/payment-failed?bookingIds=${bookingIds.join(",")}&totalPrice=${paymentAmount}`;
    const productCode = process.env.NEXT_PUBLIC_ESEWA_MERCHANT_CODE || "EPAYTEST";

    if (!paymentAmount) {
      throw new Error("Invalid eSewa payment amount");
    }

    const signatureResponse = await fetch("/api/payments/esewa-signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: paymentAmount,
        transactionUUID: transactionUuid,
        productCode,
      }),
    });

    if (!signatureResponse.ok) {
      throw new Error("Could not start eSewa payment");
    }

    const { signature } = await signatureResponse.json();

    localStorage.setItem(
      "pendingTransaction",
      JSON.stringify({
        txnId: transactionUuid,
        bookingIds,
        amount: paymentAmount,
        paymentMethod: "esewa",
      })
    );

    const form = document.createElement("form");
    form.method = "POST";
    form.action = getEsewaPaymentUrl();

    const fields = {
      amount: paymentAmount,
      tax_amount: 0,
      product_service_charge: 0,
      product_delivery_charge: 0,
      total_amount: paymentAmount,
      transaction_uuid: transactionUuid,
      product_code: productCode,
      success_url: successUrl,
      failure_url: failUrl,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
    };

    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = String(value);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const confirmCashBooking = async (bookingIds) => {
    const response = await fetch(apiUrl("/bookings/confirm"), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookingIds }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Booking confirmation failed");
    }

    router.push("/dashboard");
  };

  const handleConfirmBooking = async () => {
    setErrorMessage("");

    if (!selectedItem) {
      setErrorMessage("Please choose a valid service first.");
      return;
    }

    if (!date || !time || !locationType || (locationType === "home" && !address.trim())) {
      setErrorMessage("Please complete all required booking details.");
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage("Please agree to the terms of service and cancellation policy.");
      return;
    }

    setLoading(true);

    try {
      const requestBody = {
        package_id: bookingType === "package" ? packageIdFromQuery : null,
        service_ids: bookingType === "service" ? [serviceIdFromQuery] : [],
        booking_date: date,
        booking_time: time,
        location_type: locationType,
        address: locationType === "home" ? address.trim() : "",
        notes: notes.trim(),
        payment_method: paymentMethod,
      };

      const response = await fetch(apiUrl("/bookings"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Booking failed");
      }

      const bookingIds = data.bookingIds || [data.bookingId];
      if (paymentMethod === "esewa") {
        await startEsewaPayment(bookingIds);
      } else {
        await confirmCashBooking(bookingIds);
      }
    } catch (error) {
      setErrorMessage(error.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const canGoNextFromStepOne = Boolean(date && time);
  const canGoNextFromStepTwo = Boolean(locationType && (locationType !== "home" || address.trim()));

  const handleTimeSelect = (slot) => {
    if (!date || loading) return;

    const isBlockedByAnotherCustomer = bookedSlots.includes(slot) && time !== slot;
    if (isBlockedByAnotherCustomer) return;

    if (heldSlotRef.current?.slot !== slot || heldSlotRef.current?.date !== date) {
      releaseHeldSlot();
    }

    setTime(slot);
    setErrorMessage("");
    heldSlotRef.current = { date, slot };
    socketRef.current?.emit("hold_booking_slot", { date, slot });
  };

  return (
    <div className="min-h-screen bg-[#fffaf7]">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className={`flex min-h-screen flex-col ${isOpen ? "md:ml-70" : ""}`}>
        <Navbar />
        <div className="flex min-h-screen flex-col pt-20">
          <main className="flex-1 px-5 py-8 md:px-8">
            <div className="mx-auto mb-12 flex max-w-3xl justify-center px-1">
              <BookingStep number={1} label="Date & Time" active={step === 1} complete={step > 1} />
              <BookingStep number={2} label="Location" active={step === 2} complete={step > 2} />
              <BookingStep number={3} label="Confirm" active={step === 3} complete={false} />
            </div>

            <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_420px]">
              <section className="rounded-lg border border-rose-100 bg-white p-6 shadow-sm md:p-8">
                {errorMessage && (
                  <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                    {errorMessage}
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <div className="mb-8 flex items-center gap-3">
                      <CalendarDays className="h-7 w-7 text-pink-600" />
                      <h1 className="text-2xl font-bold text-gray-950">Select Date & Time</h1>
                    </div>

                    <label className="mb-3 block text-lg font-bold text-gray-950">Choose a Date</label>
                    <input
                      type="date"
                      value={date}
                      min={todayValue}
                      onChange={(event) => {
                        releaseHeldSlot();
                        setDate(event.target.value);
                        setTime("");
                      }}
                      className="mb-8 w-full rounded-lg border border-rose-100 bg-white px-4 py-4 text-lg text-gray-900 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100"
                    />

                    <label className="mb-4 block text-lg font-bold text-gray-950">Choose a Time Slot</label>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {filteredTimeSlots.map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        const isSelected = time === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isBooked && !isSelected}
                            onClick={() => handleTimeSelect(slot)}
                            className={`flex h-14 items-center justify-center gap-3 rounded-lg border text-base font-bold transition ${
                              isSelected
                                ? "border-pink-500 bg-pink-50 text-pink-600"
                                : "border-rose-100 bg-white text-gray-950 hover:border-pink-300"
                            } ${isBooked && !isSelected ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""}`}
                          >
                            <Clock3 className="h-5 w-5" />
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <div className="mb-8 flex items-center gap-3">
                      <MapPin className="h-7 w-7 text-pink-600" />
                      <h1 className="text-2xl font-bold text-gray-950">Choose Location</h1>
                    </div>

                    <div className="space-y-5">
                      <button
                        type="button"
                        onClick={() => setLocationType("salon")}
                        className={`flex w-full items-center gap-5 rounded-lg border p-5 text-left transition ${
                          locationType === "salon" ? "border-pink-500 bg-pink-50" : "border-rose-100 bg-white"
                        }`}
                      >
                        <span className={`h-4 w-4 rounded-full border ${locationType === "salon" ? "border-pink-600 bg-pink-600" : "border-rose-200"}`} />
                        <span className="font-bold text-gray-950">Visit Salon</span>
                        <span className="text-gray-500">{salonAddress}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLocationType("home")}
                        className={`flex w-full flex-wrap items-center gap-5 rounded-lg border p-5 text-left transition ${
                          locationType === "home" ? "border-pink-500 bg-pink-50" : "border-rose-100 bg-white"
                        }`}
                      >
                        <span className={`h-4 w-4 rounded-full border ${locationType === "home" ? "border-pink-600 bg-pink-600" : "border-rose-200"}`} />
                        <span className="font-bold text-gray-950">Home Service</span>
                        <span className="text-gray-500">We will come to your location</span>
                        <span className="font-semibold text-pink-600">+ 10% extra</span>
                      </button>
                    </div>

                    {locationType === "home" && (
                      <div className="mt-6">
                        <label className="mb-2 block text-lg font-bold text-gray-950">Home Address</label>
                        <input
                          type="text"
                          value={address}
                          onChange={(event) => setAddress(event.target.value)}
                          placeholder="Enter your full home address"
                          className="w-full rounded-lg border border-rose-100 bg-white px-4 py-4 text-gray-900 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100"
                        />
                      </div>
                    )}

                    <div className="mt-8">
                      <label className="mb-2 block text-lg font-bold text-gray-950">Additional Notes (Optional)</label>
                      <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Any special requests or preferences..."
                        rows={4}
                        className="w-full resize-none rounded-lg border border-rose-100 bg-[#fffaf7] px-4 py-4 text-gray-900 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100"
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <div className="mb-8 flex items-center gap-3">
                      <CheckCircle2 className="h-7 w-7 text-pink-600" />
                      <h1 className="text-2xl font-bold text-gray-950">Confirm Booking</h1>
                    </div>

                    <div className="grid gap-8 border-b border-rose-100 pb-8 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-gray-500">{bookingType === "package" ? "Package" : "Service"}</p>
                        <p className="text-xl font-bold text-gray-950">{selectedItem?.name || "-"}</p>
                      </div>
                      <div>
                        <p className="mb-2 text-gray-500">Time</p>
                        <p className="text-xl font-bold text-gray-950">{time || "-"}</p>
                      </div>
                      <div>
                        <p className="mb-2 text-gray-500">Date</p>
                        <p className="text-xl font-bold text-gray-950">{formatDateLabel(date)}</p>
                      </div>
                      <div>
                        <p className="mb-2 text-gray-500">Location</p>
                        <p className="text-xl font-bold text-gray-950">{locationType === "home" ? "Home" : locationType === "salon" ? "Salon" : "-"}</p>
                      </div>
                    </div>

                    <div className="mt-8">
                      <h2 className="mb-4 text-lg font-bold text-gray-950">Payment Method</h2>
                      <div className="space-y-4">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("esewa")}
                          className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left ${
                            paymentMethod === "esewa" ? "border-pink-500 bg-pink-50" : "border-rose-100 bg-white"
                          }`}
                        >
                          <span className={`h-4 w-4 rounded-full border ${paymentMethod === "esewa" ? "border-pink-600 bg-pink-600" : "border-rose-200"}`} />
                          <CreditCard className="h-5 w-5 text-green-600" />
                          <span className="font-bold text-gray-950">Pay with eSewa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("cash")}
                          className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left ${
                            paymentMethod === "cash" ? "border-pink-500 bg-pink-50" : "border-rose-100 bg-white"
                          }`}
                        >
                          <span className={`h-4 w-4 rounded-full border ${paymentMethod === "cash" ? "border-pink-600 bg-pink-600" : "border-rose-200"}`} />
                          <span className="font-bold text-gray-950">Pay Cash on Service</span>
                        </button>
                      </div>

                      <label className="mt-8 flex cursor-pointer items-start gap-3 rounded-lg bg-pink-50 p-5 text-gray-700">
                        <input
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(event) => setAgreedToTerms(event.target.checked)}
                          className="mt-1 h-4 w-4 accent-pink-600"
                        />
                        <span>
                          By confirming this booking, you agree to our terms of service and cancellation policy.
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </section>

              <BookingSummary
                item={selectedItem}
                date={date}
                time={time}
                locationType={locationType}
                total={totalPrice}
                duration={duration}
                bookingType={bookingType}
              />
            </div>

            <div className="mx-auto mt-8 grid max-w-7xl gap-6 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(1, current - 1))}
                disabled={step === 1 || loading}
                className="h-14 rounded-lg border border-rose-100 bg-white text-lg font-bold text-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep((current) => Math.min(3, current + 1))}
                  disabled={(step === 1 && !canGoNextFromStepOne) || (step === 2 && !canGoNextFromStepTwo)}
                  className="h-14 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={loading || !agreedToTerms}
                  className="h-14 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Processing..." : paymentMethod === "esewa" ? "Continue to eSewa" : "Confirm Booking"}
                </button>
              )}
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fffaf7]" />}>
      <BookingsContent />
    </Suspense>
  );
}
